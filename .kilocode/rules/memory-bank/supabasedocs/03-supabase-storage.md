# Supabase Storage: Complete Technical Reference

## Overview

Supabase Storage provides S3-compatible object storage for the Georgian Distribution System, enabling file uploads for product images, restaurant logos, and document management. It integrates seamlessly with PostgreSQL RLS policies for secure, role-based file access.

### Key Features
- **File Upload/Download** - Standard and resumable uploads (TUS protocol)
- **Public/Private Buckets** - Flexible access control
- **Image Transformations** - On-the-fly image resizing and optimization
- **CDN Integration** - Global content delivery
- **RLS Integration** - Row-level security for file access
- **S3 Compatible** - Works with AWS SDK

---

## Core Concepts

### 1. Buckets
Containers for organizing files:
- **product-images** (public) - Product photos
- **restaurant-logos** (public) - Restaurant branding
- **invoices** (private) - Order documents
- **driver-documents** (private) - Driver licenses, vehicle registration

### 2. File Paths
Hierarchical file organization:
```
bucket/folder/subfolder/filename.ext
product-images/categories/beverages/cola-500ml.jpg
restaurant-logos/{restaurant_id}/logo.png
```

### 3. Storage Policies
RLS policies control file access:
- INSERT - Who can upload files
- SELECT - Who can download/view files
- UPDATE - Who can replace files
- DELETE - Who can remove files

---

## API Reference

### Method 1: upload()

**Purpose**: Upload file to bucket

**Syntax**:
```typescript
const { data, error } = await supabase
  .storage
  .from(bucket: string)
  .upload(path: string, file: File | Blob | ArrayBuffer, options?: {
    cacheControl?: string,
    contentType?: string,
    upsert?: boolean
  })
```

**Example (Product Image Upload)**:
```typescript
// components/product-image-upload.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useState } from 'react'

export function ProductImageUpload({ productId }: { productId: string }) {
  const supabase = createBrowserClient()
  const [uploading, setUploading] = useState(false)

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${productId}-${Date.now()}.${fileExt}`
    const filePath = `products/${fileName}`

    // Upload file
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false  // Don't overwrite existing
      })

    if (error) {
      alert('Upload failed: ' + error.message)
      setUploading(false)
      return
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    // Update product record
    await supabase
      .from('products')
      .update({ image_url: publicUrl })
      .eq('id', productId)

    alert('Image uploaded!')
    setUploading(false)
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  )
}
```

---

### Method 2: download()

**Purpose**: Download file from private bucket

**Syntax**:
```typescript
const { data, error } = await supabase
  .storage
  .from(bucket: string)
  .download(path: string)
```

**Example (Invoice Download)**:
```typescript
async function downloadInvoice(orderId: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.storage
    .from('invoices')
    .download(`orders/${orderId}/invoice.pdf`)

  if (error) {
    console.error('Download failed:', error)
    return
  }

  // Create download link
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = `invoice-${orderId}.pdf`
  a.click()
}
```

---

### Method 3: getPublicUrl()

**Purpose**: Get public URL for file (public buckets only)

**Syntax**:
```typescript
const { data } = supabase
  .storage
  .from(bucket: string)
  .getPublicUrl(path: string, options?: {
    transform?: {
      width?: number,
      height?: number,
      resize?: 'cover' | 'contain' | 'fill',
      quality?: number
    }
  })
```

**Example (Product Image with Transformation)**:
```typescript
// Get optimized thumbnail
const { data } = supabase.storage
  .from('product-images')
  .getPublicUrl('products/cola-500ml.jpg', {
    transform: {
      width: 300,
      height: 300,
      resize: 'cover',
      quality: 80
    }
  })

return <img src={data.publicUrl} alt="Product" />
```

---

### Method 4: createSignedUrl()

**Purpose**: Create temporary signed URL for private files

**Syntax**:
```typescript
const { data, error } = await supabase
  .storage
  .from(bucket: string)
  .createSignedUrl(path: string, expiresIn: number)
```

**Example (Temporary Driver Document Access)**:
```typescript
// Admin views driver license (private file)
async function viewDriverLicense(driverId: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.storage
    .from('driver-documents')
    .createSignedUrl(`${driverId}/license.jpg`, 60)  // 60 seconds

  if (error) {
    console.error('Failed to generate URL:', error)
    return
  }

  window.open(data.signedUrl, '_blank')
}
```

---

### Method 5: list()

**Purpose**: List files in bucket/folder

**Syntax**:
```typescript
const { data, error } = await supabase
  .storage
  .from(bucket: string)
  .list(path?: string, options?: {
    limit?: number,
    offset?: number,
    sortBy?: { column: string, order: 'asc' | 'desc' }
  })
```

**Example (List Product Images)**:
```typescript
const { data: files, error } = await supabase.storage
  .from('product-images')
  .list('products', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' }
  })
```

---

### Method 6: remove()

**Purpose**: Delete files from bucket

**Syntax**:
```typescript
const { data, error } = await supabase
  .storage
  .from(bucket: string)
  .remove(paths: string[])
```

**Example (Delete Product Images)**:
```typescript
async function deleteProductImages(productId: string) {
  const supabase = createBrowserClient()

  // List all images for product
  const { data: files } = await supabase.storage
    .from('product-images')
    .list(`products/${productId}`)

  if (!files) return

  // Delete all files
  const filePaths = files.map(file => `products/${productId}/${file.name}`)
  
  const { error } = await supabase.storage
    .from('product-images')
    .remove(filePaths)

  if (error) {
    console.error('Delete failed:', error)
  }
}
```

---

### Method 7: update()

**Purpose**: Replace existing file

**Syntax**:
```typescript
const { data, error } = await supabase
  .storage
  .from(bucket: string)
  .update(path: string, file: File | Blob, options?: {
    cacheControl?: string,
    contentType?: string,
    upsert?: boolean
  })
```

**Example (Update Restaurant Logo)**:
```typescript
async function updateRestaurantLogo(restaurantId: string, file: File) {
  const supabase = createBrowserClient()

  const path = `${restaurantId}/logo.png`

  const { data, error } = await supabase.storage
    .from('restaurant-logos')
    .update(path, file, {
      cacheControl: '3600',
      upsert: true  // Create if doesn't exist
    })

  if (error) {
    console.error('Update failed:', error)
    return
  }

  // CDN may take time to propagate
  console.log('Logo updated, may take a few minutes to appear')
}
```

---

### Method 8: move()

**Purpose**: Move/rename file

**Syntax**:
```typescript
const { data, error } = await supabase
  .storage
  .from(bucket: string)
  .move(fromPath: string, toPath: string)
```

**Example**:
```typescript
// Rename file
await supabase.storage
  .from('product-images')
  .move('products/old-name.jpg', 'products/new-name.jpg')
```

---

### Method 9: copy()

**Purpose**: Copy file to new location

**Syntax**:
```typescript
const { data, error } = await supabase
  .storage
  .from(bucket: string)
  .copy(fromPath: string, toPath: string)
```

---

### Method 10: createSignedUploadUrl()

**Purpose**: Generate URL for unauthenticated uploads

**Syntax**:
```typescript
const { data, error } = await supabase
  .storage
  .from(bucket: string)
  .createSignedUploadUrl(path: string)
```

**Example (Public Upload Form)**:
```typescript
// Generate signed upload URL (valid for 2 hours)
const { data, error } = await supabase.storage
  .from('public-uploads')
  .createSignedUploadUrl('temp/file.jpg')

// Use token to upload without authentication
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('public-uploads')
  .uploadToSignedUrl('temp/file.jpg', data.token, file)
```

---

## Use Cases

### Use Case 1: Multi-File Upload with Progress

```typescript
// components/multi-file-upload.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useState } from 'react'

export function MultiFileUpload() {
  const supabase = createBrowserClient()
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})

  async function handleUpload() {
    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`
      const filePath = `products/${fileName}`

      // Upload with progress tracking
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600'
        })

      if (error) {
        console.error(`Failed to upload ${file.name}:`, error)
      } else {
        setProgress(prev => ({ ...prev, [file.name]: 100 }))
      }
    }
  }

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
      />
      <button onClick={handleUpload}>Upload All</button>
      {Object.entries(progress).map(([name, percent]) => (
        <div key={name}>
          {name}: {percent}%
        </div>
      ))}
    </div>
  )
}
```

---

### Use Case 2: Image Gallery with Lazy Loading

```typescript
// components/product-gallery.tsx
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function ProductGallery({ productId }: { productId: string }) {
  const supabase = createBrowserClient()
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    loadImages()
  }, [productId])

  async function loadImages() {
    const { data: files } = await supabase.storage
      .from('product-images')
      .list(`products/${productId}`)

    if (!files) return

    const urls = files.map(file => {
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(`products/${productId}/${file.name}`, {
          transform: {
            width: 400,
            height: 400,
            resize: 'cover',
            quality: 80
          }
        })
      return data.publicUrl
    })

    setImages(urls)
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map((url, i) => (
        <img key={i} src={url} alt={`Product ${i + 1}`} loading="lazy" />
      ))}
    </div>
  )
}
```

---

## Security Considerations

### 1. Storage RLS Policies

**Create policies for each bucket**:

```sql
-- Allow authenticated users to upload product images
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'products'
  );

-- Allow public read access to product images
CREATE POLICY "Public can view product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Restaurants can only upload to their folder
CREATE POLICY "Restaurants upload to own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'restaurant-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Restaurants can only delete their own files
CREATE POLICY "Restaurants delete own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'restaurant-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

### 2. File Validation

```typescript
// Validate file before upload
function validateFile(file: File): string | null {
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return 'File too large (max 5MB)'
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return 'Invalid file type. Only JPG, PNG, WebP allowed'
  }

  // Check filename
  const unsafeChars = /[<>:"/\\|?*]/
  if (unsafeChars.test(file.name)) {
    return 'Filename contains invalid characters'
  }

  return null  // Valid
}
```

---

## Performance Optimization

### 1. Image Transformations

Use CDN transformations instead of uploading multiple sizes:

```typescript
// Generate multiple sizes on-the-fly
const sizes = [
  { width: 100, height: 100 },   // Thumbnail
  { width: 400, height: 400 },   // Medium
  { width: 1200, height: 1200 }  // Large
]

const urls = sizes.map(size => {
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl('products/image.jpg', {
      transform: {
        ...size,
        resize: 'cover',
        quality: 80
      }
    })
  return data.publicUrl
})
```

---

### 2. Lazy Loading

```typescript
<img src={imageUrl} loading="lazy" alt="Product" />
```

---

### 3. CDN Caching

```typescript
// Set cache headers
const { data, error } = await supabase.storage
  .from('product-images')
  .upload(path, file, {
    cacheControl: '31536000'  // 1 year
  })
```

---

## Best Practices

1. **Use unique filenames** - Include timestamp or UUID
2. **Validate files client-side** - Check size/type before upload
3. **Implement RLS policies** - Secure file access
4. **Use image transformations** - Don't upload multiple sizes
5. **Set cache headers** - Improve CDN performance
6. **Delete unused files** - Keep storage costs low
7. **Use signed URLs** - For temporary access to private files

---

## Troubleshooting

### Issue 1: Upload Fails with 413 Payload Too Large

**Solution**: Check file size limit

```typescript
// Compress image before upload
async function compressImage(file: File): Promise<File> {
  // Use browser-image-compression or similar
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920
  })
  return compressed
}
```

---

### Issue 2: Images Not Showing After Upload

**Cause**: CDN propagation delay

**Solution**: Add cache-busting query param

```typescript
const url = `${publicUrl}?t=${Date.now()}`
```

---

### Issue 3: RLS Policy Blocking Upload

**Solution**: Check policies and permissions

```sql
-- Verify user can upload
SELECT 
  auth.uid() as user_id,
  bucket_id,
  name
FROM storage.objects
WHERE bucket_id = 'product-images';
```

---

## TypeScript Types

```typescript
import { SupabaseClient } from '@supabase/supabase-js'

interface FileUploadResult {
  data: {
    id: string
    path: string
    fullPath: string
  } | null
  error: Error | null
}

interface FileObject {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: {
    eTag: string
    size: number
    mimetype: string
    cacheControl: string
  }
}

type TransformOptions = {
  width?: number
  height?: number
  resize?: 'cover' | 'contain' | 'fill'
  quality?: number
}
```

---

## Next.js Integration

### Server Component

```typescript
// app/products/[id]/page.tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  // Get product data
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single()

  // Get public URL for image
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(product.image_path)

  return (
    <div>
      <img src={publicUrl} alt={product.name} />
    </div>
  )
}
```

### API Route

```typescript
// app/api/upload/route.ts
import { createRouteHandlerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient()

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(`products/${Date.now()}-${file.name}`, file)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ path: data.path })
}
```

---

## Related Documentation

- [01-supabase-auth.md](./01-supabase-auth.md) - Authentication for file access
- [05-row-level-security.md](./05-row-level-security.md) - Storage RLS policies

---

## Official Resources

- **Docs**: https://supabase.com/docs/guides/storage
- **API Reference**: https://supabase.com/docs/reference/javascript/storage-from-upload

---

*Last Updated: October 29, 2025*  
*Supabase Storage Version: Latest*  
*Project: Georgian Distribution System*
