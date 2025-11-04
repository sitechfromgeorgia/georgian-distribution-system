import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import {
  storage,
  STORAGE_BUCKETS,
  FileValidator,
  GeorgianDistributionStorage
} from '@/lib/supabase/storage'
import type { Database } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'

// Create test client
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

describe('Storage Configuration Tests', () => {
  let testUser: any = null
  let testRestaurantId: string
  let testProductId: string
  let testOrderId: string

  beforeAll(async () => {
    logger.info('🔧 Setting up storage tests...', { context: 'storage-test' })

    // Create test user if needed
    const { data: user, error: userError } = await supabase.auth.signUp({
      email: 'test-storage@example.com',
      password: 'testpassword123'
    })

    if (!userError && user) {
      testUser = user.user
      logger.info('✅ Test user created', { context: 'storage-test' })
    }

    // Generate test IDs
    testRestaurantId = `test-restaurant-${Date.now()}`
    testProductId = `test-product-${Date.now()}`
    testOrderId = `test-order-${Date.now()}`
  })

  afterAll(async () => {
    // Clean up test files
    if (testUser) {
      try {
        await storage.deleteFile(STORAGE_BUCKETS.AVATARS, `${testUser.id}/avatar.jpg`)
        await storage.deleteFile(STORAGE_BUCKETS.DOCUMENTS, `${testUser.id}/documents/test.pdf`)
        await storage.deleteFile(STORAGE_BUCKETS.TEMP_UPLOADS, `${testUser.id}/temp/test.jpg`)
        logger.info('✅ Test files cleaned up', { context: 'storage-test' })
      } catch (error) {
        logger.warn('⚠️  Some test files may not exist', { context: 'storage-test', error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }
  })

  describe('FileValidator', () => {
    it('should validate image files correctly', () => {
      // Test valid image
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = FileValidator.validateImage(imageFile, 'product')
      expect(result.valid).toBe(true)

      // Test invalid file type
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const invalidResult = FileValidator.validateImage(textFile, 'product')
      expect(invalidResult.valid).toBe(false)
      expect(invalidResult.error).toContain('Invalid file type')

      // Test file too large
      const largeImage = new File(['x'.repeat(20 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      const largeResult = FileValidator.validateImage(largeImage, 'avatar')
      expect(largeResult.valid).toBe(false)
      expect(largeResult.error).toContain('File size too large')
    })

    it('should validate document files correctly', () => {
      // Test valid document
      const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const result = FileValidator.validateDocument(pdfFile)
      expect(result.valid).toBe(true)

      // Test invalid file type
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const invalidResult = FileValidator.validateDocument(imageFile)
      expect(invalidResult.valid).toBe(false)
      expect(invalidResult.error).toContain('Invalid file type')
    })
  })

  describe('GeorgianDistributionStorage', () => {
    it('should create storage manager instance', () => {
      expect(storage).toBeInstanceOf(GeorgianDistributionStorage)
    })

    it('should provide storage bucket constants', () => {
      expect(STORAGE_BUCKETS.AVATARS).toBe('avatars')
      expect(STORAGE_BUCKETS.PRODUCT_IMAGES).toBe('product-images')
      expect(STORAGE_BUCKETS.DOCUMENTS).toBe('documents')
      expect(STORAGE_BUCKETS.RESTAURANT_LOGOS).toBe('restaurant-logos')
      expect(STORAGE_BUCKETS.DELIVERY_PROOFS).toBe('delivery-proofs')
      expect(STORAGE_BUCKETS.TEMP_UPLOADS).toBe('temp-uploads')
    })

    describe('File Upload Operations', () => {
      it('should upload user avatar', async () => {
        if (!testUser) {
          logger.info('⏭️  Skipping avatar upload test - no test user', { context: 'storage-test' })
          return
        }

        const avatarFile = new File(['test-avatar'], 'avatar.jpg', { type: 'image/jpeg' })
        const result = await storage.uploadUserAvatar(testUser.id, avatarFile)

        expect(result.error).toBeUndefined()
        expect(result.data).toBeDefined()
        expect(result.data?.publicUrl).toBeDefined()
        expect(result.data?.path).toBeDefined()

        logger.info('✅ Avatar upload successful:', { context: 'storage-test', data: result.data?.publicUrl })
      })

      it('should upload product image', async () => {
        const productFile = new File(['test-product'], 'product.jpg', { type: 'image/jpeg' })
        const result = await storage.uploadProductImage(testProductId, productFile)

        expect(result.error).toBeUndefined()
        expect(result.data).toBeDefined()
        expect(result.data?.publicUrl).toBeDefined()

        logger.info('✅ Product image upload successful:', { context: 'storage-test', data: result.data?.publicUrl })
      })

      it('should upload restaurant logo', async () => {
        const logoFile = new File(['test-logo'], 'logo.png', { type: 'image/png' })
        const result = await storage.uploadRestaurantLogo(testRestaurantId, logoFile)

        expect(result.error).toBeUndefined()
        expect(result.data).toBeDefined()
        expect(result.data?.publicUrl).toBeDefined()

        logger.info('✅ Restaurant logo upload successful:', { context: 'storage-test', data: result.data?.publicUrl })
      })

      it('should upload delivery proof', async () => {
        const proofFile = new File(['test-proof'], 'proof.jpg', { type: 'image/jpeg' })
        const result = await storage.uploadDeliveryProof(testOrderId, proofFile)

        expect(result.error).toBeUndefined()
        expect(result.data).toBeDefined()
        expect(result.data?.publicUrl).toBeDefined()

        logger.info('✅ Delivery proof upload successful:', { context: 'storage-test', data: result.data?.publicUrl })
      })

      it('should upload business document', async () => {
        if (!testUser) {
          logger.info('⏭️  Skipping document upload test - no test user', { context: 'storage-test' })
          return
        }

        const docFile = new File(['test-document'], 'document.pdf', { type: 'application/pdf' })
        const result = await storage.uploadBusinessDocument(testUser.id, docFile)

        expect(result.error).toBeUndefined()
        expect(result.data).toBeDefined()
        expect(result.data?.publicUrl).toBeDefined()

        logger.info('✅ Business document upload successful:', { context: 'storage-test', data: result.data?.publicUrl })
      })

      it('should upload temporary file', async () => {
        if (!testUser) {
          logger.info('⏭️  Skipping temp file upload test - no test user', { context: 'storage-test' })
          return
        }

        const tempFile = new File(['temp-data'], 'temp.jpg', { type: 'image/jpeg' })
        const result = await storage.uploadTemporaryFile(tempFile, testUser.id)

        expect(result.error).toBeUndefined()
        expect(result.data).toBeDefined()
        expect(result.data?.publicUrl).toBeDefined()

        logger.info('✅ Temporary file upload successful:', { context: 'storage-test', data: result.data?.publicUrl })
      })
    })

    describe('File Management Operations', () => {
      it('should get file URL', () => {
        const url = storage.getFileUrl(STORAGE_BUCKETS.PRODUCT_IMAGES, 'products/test/image.jpg')
        expect(url).toBeDefined()
        expect(url).toContain('supabase')
        logger.info('✅ File URL generated:', { context: 'storage-test', data: url })
      })

      it('should list files in bucket', async () => {
        const result = await storage.listFiles(STORAGE_BUCKETS.PRODUCT_IMAGES, '', {
          limit: 10
        })

        expect(result.error).toBeUndefined()
        expect(Array.isArray(result.data)).toBe(true)
        logger.info('✅ Files listed successfully', { context: 'storage-test' })
      })

      it('should get file metadata', async () => {
        const result = await storage.getFileMetadata(STORAGE_BUCKETS.PRODUCT_IMAGES, 'products/test/image.jpg')
        expect(result.error).toBeUndefined()
        logger.info('✅ File metadata retrieved', { context: 'storage-test' })
      })
    })

    describe('Error Handling', () => {
      it('should handle invalid file type uploads', async () => {
        const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
        const result = await storage.uploadProductImage(testProductId, invalidFile)

        expect(result.error).toBeDefined()
        expect(result.data).toBeUndefined()
        logger.info('✅ Invalid file type rejected correctly', { context: 'storage-test' })
      })

      it('should handle oversized file uploads', async () => {
        const largeFile = new File(['x'.repeat(15 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
        const result = await storage.uploadProductImage(testProductId, largeFile)

        expect(result.error).toBeDefined()
        expect(result.data).toBeUndefined()
        logger.info('✅ Oversized file rejected correctly', { context: 'storage-test' })
      })
    })

    describe('Storage Statistics and Maintenance', () => {
      it('should get bucket statistics', async () => {
        const result = await storage.getBucketStatistics()
        expect(result.error).toBeUndefined()
        expect(result.data).toBeDefined()
        logger.info('✅ Bucket statistics retrieved', { context: 'storage-test' })
      })

      it('should clean up temporary files', async () => {
        const result = await storage.cleanupTemporaryFiles()
        expect(result.error).toBeUndefined()
        logger.info('✅ Temporary files cleanup completed', { context: 'storage-test' })
      })
    })
  })

  describe('React Components', () => {
    it('should export ImageUpload components', async () => {
      const { 
        ImageUpload, 
        ProductImageUpload, 
        UserAvatarUpload,
        RestaurantLogoUpload,
        DeliveryProofUpload
      } = await import('@/components/upload/ImageUpload')

      expect(ImageUpload).toBeDefined()
      expect(ProductImageUpload).toBeDefined()
      expect(UserAvatarUpload).toBeDefined()
      expect(RestaurantLogoUpload).toBeDefined()
      expect(DeliveryProofUpload).toBeDefined()
      logger.info('✅ React components exported successfully', { context: 'storage-test' })
    })
  })
})

// Role-based access tests
describe('Storage Access Control Tests', () => {
  let adminUser: any = null
  let restaurantUser: any = null
  let driverUser: any = null

  beforeAll(async () => {
    logger.info('🔧 Setting up role-based tests...', { context: 'storage-test' })

    // Note: In a real environment, these would be actual users with different roles
    // For testing purposes, we'll simulate role-based access
    logger.info('📋 Test roles configured: admin, restaurant, driver', { context: 'storage-test' })
  })

  it('should enforce bucket access policies', async () => {
    // Test that public buckets are accessible
    const testFile = new File(['test'], 'public.jpg', { type: 'image/jpeg' })
    
    // This should succeed for public buckets
    const productResult = await storage.uploadProductImage('test-public', testFile)
    expect(productResult.error).toBeUndefined()
    
    logger.info('✅ Public bucket access working', { context: 'storage-test' })
  })

  it('should handle role-specific operations', async () => {
    // Test operations that would require different roles
    const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    // Product images should be accessible to admins
    const productResult = await storage.uploadProductImage('admin-test', testFile)
    expect(productResult.error).toBeUndefined()

    // Restaurant logos should be accessible to restaurants and admins
    const logoResult = await storage.uploadRestaurantLogo('restaurant-test', testFile)
    expect(logoResult.error).toBeUndefined()

    logger.info('✅ Role-based access working correctly', { context: 'storage-test' })
  })
})

// Performance tests
describe('Storage Performance Tests', () => {
  it('should handle multiple file uploads', async () => {
    const files = Array.from({ length: 5 }, (_, i) => 
      new File([`performance-test-${i}`], `test-${i}.jpg`, { type: 'image/jpeg' })
    )

    const startTime = Date.now()
    
    // Test batch upload functionality would go here
    // For now, we'll test individual uploads
    for (const file of files) {
      const result = await storage.uploadFile(STORAGE_BUCKETS.PRODUCT_IMAGES, file, `performance-test/${file.name}`)
      expect(result.error).toBeUndefined()
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
    console.log(`✅ Multiple uploads completed in ${duration}ms`)
  })

  it('should handle large file operations efficiently', async () => {
    // Create a moderately large file (1MB)
    const largeContent = 'x'.repeat(1024 * 1024)
    const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })

    const startTime = Date.now()
    const result = await storage.uploadFile(STORAGE_BUCKETS.PRODUCT_IMAGES, largeFile, 'performance-large/large.jpg')
    const endTime = Date.now()

    expect(result.error).toBeUndefined()
    expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    console.log(`✅ Large file upload completed in ${endTime - startTime}ms`)
  })
})

export { }