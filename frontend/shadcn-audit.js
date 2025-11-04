const puppeteer = require('puppeteer');
const fs = require('fs');

async function auditShadcnUI() {
  console.log('🚀 Starting comprehensive shadcn UI audit...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const auditResults = {
    timestamp: new Date().toISOString(),
    url: 'http://localhost:3000',
    issues: [],
    components: {},
    accessibility: [],
    responsive: [],
    performance: [],
    styling: [],
    interactivity: []
  };

  try {
    // Navigate to the application
    console.log('📍 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Check if page loaded successfully
    const title = await page.title();
    console.log(`✅ Page loaded: ${title}`);

    // Get all shadcn UI components on the page
    const components = await page.$$('[data-slot], button, input, select, textarea, [role="dialog"], [role="alert"], [class*="bg-"], [class*="text-"], [class*="border-"]');

    console.log(`🔍 Found ${components.length} potential shadcn UI elements`);

    // Audit each component
    for (let i = 0; i < Math.min(components.length, 50); i++) {
      const element = components[i];
      const componentInfo = await page.evaluate(el => {
        const classes = el.className || '';
        const tagName = el.tagName.toLowerCase();
        const role = el.getAttribute('role');
        const dataSlot = el.getAttribute('data-slot');
        const ariaLabel = el.getAttribute('aria-label');
        const ariaDescribedBy = el.getAttribute('aria-describedby');
        const ariaInvalid = el.getAttribute('aria-invalid');

        return {
          tagName,
          classes: classes.split(' ').filter(c => c.includes('shadcn') || c.startsWith('bg-') || c.startsWith('text-') || c.startsWith('border-')),
          role,
          dataSlot,
          ariaLabel,
          ariaDescribedBy,
          ariaInvalid,
          hasFocusRing: classes.includes('focus-visible:ring'),
          hasDisabledState: classes.includes('disabled:opacity') || classes.includes('disabled:pointer-events'),
          isInteractive: ['button', 'input', 'select', 'textarea', 'a'].includes(tagName) || role === 'button'
        };
      }, element);

      // Check for common issues
      const issues = [];

      // Accessibility checks
      if (componentInfo.isInteractive && !componentInfo.ariaLabel && !el.textContent?.trim()) {
        issues.push('Missing accessible label');
      }

      if (componentInfo.ariaInvalid === 'true' && !componentInfo.ariaDescribedBy) {
        issues.push('Invalid field without error description');
      }

      // Styling checks
      if (!componentInfo.hasFocusRing && componentInfo.isInteractive) {
        issues.push('Missing focus ring for interactive element');
      }

      if (!componentInfo.hasDisabledState && componentInfo.isInteractive) {
        issues.push('Missing disabled state styling');
      }

      if (issues.length > 0) {
        auditResults.issues.push({
          element: i,
          component: componentInfo,
          issues
        });
      }
    }

    // Check for CSS conflicts
    console.log('🎨 Checking for CSS conflicts...');
    const cssConflicts = await page.evaluate(() => {
      const conflicts = [];
      const elements = document.querySelectorAll('*');

      elements.forEach(el => {
        const computed = window.getComputedStyle(el);
        const importantRules = [];

        // Check for !important declarations that might conflict
        if (computed.cssText.includes('!important')) {
          importantRules.push(computed.cssText);
        }

        if (importantRules.length > 0) {
          conflicts.push({
            element: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
            importantRules
          });
        }
      });

      return conflicts;
    });

    auditResults.styling = cssConflicts;

    // Accessibility audit
    console.log('♿ Running accessibility audit...');
    const accessibilityIssues = await page.evaluate(() => {
      const issues = [];

      // Check for missing alt text on images
      const images = document.querySelectorAll('img:not([alt])');
      if (images.length > 0) {
        issues.push(`Found ${images.length} images without alt text`);
      }

      // Check for buttons without accessible names
      const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
      buttons.forEach(btn => {
        if (!btn.textContent?.trim()) {
          issues.push('Button without accessible name found');
        }
      });

      // Check for form inputs without labels
      const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby]):not([type="hidden"])');
      inputs.forEach(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (!label && !input.placeholder) {
          issues.push('Form input without label or placeholder');
        }
      });

      return issues;
    });

    auditResults.accessibility = accessibilityIssues;

    // Responsive design check
    console.log('📱 Testing responsive design...');
    const responsiveIssues = [];

    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewport(viewport);
      await new Promise(resolve => setTimeout(resolve, 500));

      const layoutIssues = await page.evaluate((vp) => {
        const issues = [];

        // Check for horizontal scroll
        if (document.body.scrollWidth > window.innerWidth) {
          issues.push(`${vp.name}: Horizontal scroll detected (${document.body.scrollWidth}px > ${window.innerWidth}px)`);
        }

        // Check for elements extending beyond viewport
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth || rect.left < 0) {
            issues.push(`${vp.name}: Element extends beyond viewport: ${el.tagName}.${el.className.split(' ')[0] || ''}`);
          }
        });

        return issues;
      }, viewport);

      responsiveIssues.push(...layoutIssues);
    }

    auditResults.responsive = responsiveIssues;

    // Performance check
    console.log('⚡ Checking performance...');
    const performanceMetrics = await page.evaluate(() => {
      const metrics = {
        domContentLoaded: performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd,
        loadComplete: performance.getEntriesByType('navigation')[0]?.loadEventEnd,
        cssSize: 0,
        jsSize: 0,
        imageSize: 0
      };

      // Calculate resource sizes
      const resources = performance.getEntriesByType('resource');
      resources.forEach(resource => {
        if (resource.name.includes('.css')) {
          metrics.cssSize += resource.transferSize || 0;
        } else if (resource.name.includes('.js')) {
          metrics.jsSize += resource.transferSize || 0;
        } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)/)) {
          metrics.imageSize += resource.transferSize || 0;
        }
      });

      return metrics;
    });

    auditResults.performance = performanceMetrics;

    // Component interaction test
    console.log('🖱️ Testing component interactions...');
    const interactionIssues = [];

    // Test button clicks
    const buttons = await page.$$('button:not([disabled])');
    for (const button of buttons.slice(0, 5)) { // Test first 5 buttons
      try {
        const isVisible = await button.isIntersectingViewport();
        if (isVisible) {
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 100));
          // Check if any state changes occurred
        }
      } catch (error) {
        interactionIssues.push(`Button click failed: ${error.message}`);
      }
    }

    auditResults.interactivity = interactionIssues;

  } catch (error) {
    console.error('❌ Audit failed:', error);
    auditResults.error = error.message;
  } finally {
    await browser.close();
  }

  // Generate report
  const report = generateAuditReport(auditResults);
  fs.writeFileSync('shadcn-audit-report.json', JSON.stringify(auditResults, null, 2));
  fs.writeFileSync('shadcn-audit-report.md', report);

  console.log('\n📊 Audit complete! Reports saved:');
  console.log('- shadcn-audit-report.json');
  console.log('- shadcn-audit-report.md');

  return auditResults;
}

function generateAuditReport(results) {
  let report = `# shadcn UI Audit Report\n\n`;
  report += `**Date:** ${results.timestamp}\n`;
  report += `**URL:** ${results.url}\n\n`;

  // Summary
  const totalIssues = results.issues.length + results.accessibility.length +
                     results.responsive.length + results.styling.length + results.interactivity.length;

  report += `## Summary\n\n`;
  report += `- **Total Issues Found:** ${totalIssues}\n`;
  report += `- **Component Issues:** ${results.issues.length}\n`;
  report += `- **Accessibility Issues:** ${results.accessibility.length}\n`;
  report += `- **Responsive Issues:** ${results.responsive.length}\n`;
  report += `- **Styling Conflicts:** ${results.styling.length}\n`;
  report += `- **Interaction Issues:** ${results.interactivity.length}\n\n`;

  // Performance
  if (results.performance) {
    report += `## Performance Metrics\n\n`;
    report += `- **DOM Content Loaded:** ${results.performance.domContentLoaded}ms\n`;
    report += `- **Load Complete:** ${results.performance.loadComplete}ms\n`;
    report += `- **CSS Size:** ${(results.performance.cssSize / 1024).toFixed(2)} KB\n`;
    report += `- **JS Size:** ${(results.performance.jsSize / 1024).toFixed(2)} KB\n`;
    report += `- **Image Size:** ${(results.performance.imageSize / 1024).toFixed(2)} KB\n\n`;
  }

  // Issues by category
  if (results.issues.length > 0) {
    report += `## Component Issues\n\n`;
    results.issues.forEach((issue, index) => {
      report += `### Issue ${index + 1}\n`;
      report += `- **Element:** ${issue.element}\n`;
      report += `- **Component:** ${JSON.stringify(issue.component, null, 2)}\n`;
      report += `- **Problems:**\n`;
      issue.issues.forEach(problem => {
        report += `  - ${problem}\n`;
      });
      report += '\n';
    });
  }

  if (results.accessibility.length > 0) {
    report += `## Accessibility Issues\n\n`;
    results.accessibility.forEach(issue => {
      report += `- ${issue}\n`;
    });
    report += '\n';
  }

  if (results.responsive.length > 0) {
    report += `## Responsive Design Issues\n\n`;
    results.responsive.forEach(issue => {
      report += `- ${issue}\n`;
    });
    report += '\n';
  }

  if (results.styling.length > 0) {
    report += `## Styling Conflicts\n\n`;
    results.styling.forEach(conflict => {
      report += `- **${conflict.element}:**\n`;
      conflict.importantRules.forEach(rule => {
        report += `  - ${rule}\n`;
      });
    });
    report += '\n';
  }

  if (results.interactivity.length > 0) {
    report += `## Interaction Issues\n\n`;
    results.interactivity.forEach(issue => {
      report += `- ${issue}\n`;
    });
    report += '\n';
  }

  // Recommendations
  report += `## Recommendations\n\n`;

  if (results.issues.length > 0) {
    report += `### Component Fixes\n`;
    report += `- Add proper ARIA labels to interactive elements\n`;
    report += `- Implement focus rings for keyboard navigation\n`;
    report += `- Add disabled states for form controls\n`;
    report += `- Ensure error states are properly communicated\n\n`;
  }

  if (results.accessibility.length > 0) {
    report += `### Accessibility Improvements\n`;
    report += `- Add alt text to all images\n`;
    report += `- Ensure all buttons have accessible names\n`;
    report += `- Associate form inputs with labels\n`;
    report += `- Test with screen readers\n\n`;
  }

  if (results.responsive.length > 0) {
    report += `### Responsive Design Fixes\n`;
    report += `- Fix horizontal scrolling issues\n`;
    report += `- Ensure elements stay within viewport bounds\n`;
    report += `- Test on multiple device sizes\n`;
    report += `- Use responsive breakpoints properly\n\n`;
  }

  if (results.styling.length > 0) {
    report += `### Styling Improvements\n`;
    report += `- Avoid !important declarations when possible\n`;
    report += `- Use Tailwind's utility classes consistently\n`;
    report += `- Check for CSS specificity conflicts\n`;
    report += `- Ensure shadcn theme variables are used\n\n`;
  }

  return report;
}

// Run the audit
auditShadcnUI().catch(console.error);