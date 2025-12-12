# Infrastructure Plan for TJProHammer Photography Site

## Current State

- **Development**: Using localStorage for temporary pin storage
- **Data Service**: Abstraction layer ready for S3 integration
- **Real-time Updates**: Event-driven system for live synchronization

## Production Infrastructure Needed

### 1. AWS S3 + API Gateway + Lambda Architecture

#### S3 Bucket Structure

```
tjprohammer-photography-data/
├── pins/
│   ├── pins.json (main pin data)
│   └── backup/
│       ├── pins-2024-09-29.json
│       └── pins-2024-09-28.json
└── images/
    ├── locations/
    │   ├── mount-rainier/
    │   └── red-desert/
    └── thumbnails/
```

#### API Gateway Endpoints

```
POST /api/pins          - Create new pin
GET /api/pins           - Get all pins
PUT /api/pins/{id}      - Update existing pin
DELETE /api/pins/{id}   - Delete pin
POST /api/pins/images   - Upload images
```

#### Lambda Functions Needed

1. **pins-crud-handler** - Handle CRUD operations for pins
2. **image-processor** - Process and resize uploaded images
3. **backup-scheduler** - Daily backup of pin data
4. **auth-validator** - Validate admin authentication

### 2. Authentication & Security

- **AWS Cognito** for proper admin authentication
- **API Keys** for rate limiting
- **CORS** configuration for your domain
- **S3 bucket policies** for secure image access

### 3. Image Management

- **S3 CloudFront** for fast image delivery
- **Lambda Edge** for image resizing on-demand
- **WebP conversion** for optimized loading

### 4. Deployment Pipeline

- **GitHub Actions** for CI/CD
- **Terraform/CloudFormation** for infrastructure as code
- **Environment separation** (dev/staging/prod)

## Implementation Priority

### Phase 1: Basic S3 Integration (Week 1)

1. Set up S3 bucket for pin data
2. Create Lambda function for pin CRUD operations
3. Set up API Gateway endpoints
4. Update PinDataService to use API instead of localStorage

### Phase 2: Image Management (Week 2)

1. S3 bucket for image storage
2. Image upload functionality in admin interface
3. CloudFront distribution for fast delivery
4. Image processing pipeline

### Phase 3: Authentication & Security (Week 3)

1. Replace simple password with AWS Cognito
2. Implement proper JWT token validation
3. Add role-based access control
4. Security audit and penetration testing

### Phase 4: Advanced Features (Week 4)

1. Real-time collaboration (multiple admin users)
2. Version history for pins
3. Automated backups
4. Analytics and monitoring

## Cost Estimation (Monthly)

- **S3 Storage**: $5-20 (depending on images)
- **Lambda**: $10-30 (based on usage)
- **API Gateway**: $5-15
- **CloudFront**: $5-25
- **Cognito**: $0-10 (first 50,000 MAUs free)
- **Total**: ~$25-100/month

## Next Steps

1. Set up AWS account and basic S3 bucket
2. Create simple Lambda function for pin management
3. Test API Gateway integration
4. Update frontend to use production API

Would you like me to start implementing Phase 1 with the basic S3 integration?
