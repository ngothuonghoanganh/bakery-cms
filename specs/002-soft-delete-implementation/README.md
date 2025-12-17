# Soft Delete Implementation - Feature Specification

## Overview

This specification describes the implementation of soft delete functionality for the Bakery-CMS backend system. Instead of permanently removing records from the database, soft delete marks records as deleted using a `deletedAt` timestamp, enabling data recovery and maintaining audit trails.

## Documentation Structure

This specification includes the following documents:

### 1. [specification.md](./specification.md)
**Main technical specification document**

Contains:
- Business requirements and rules
- Data model changes
- Technical implementation details
- Architecture diagrams
- Migration strategy
- API changes
- Testing strategy
- Risk assessment

**Audience:** Developers, Technical Leads, Product Managers

### 2. [data-model.md](./data-model.md)
**Detailed data model specification**

Contains:
- Database schema changes
- Index strategy
- Query patterns
- Sequelize scope configuration
- Cascade delete strategy
- Performance considerations

**Audience:** Database Developers, Backend Engineers

### 3. [quickstart.md](./quickstart.md)
**Step-by-step implementation guide**

Contains:
- Prerequisites
- Implementation steps
- Migration procedures
- Code examples
- Deployment guide
- Rollback procedures
- Troubleshooting

**Audience:** Developers implementing the feature

### 4. [testing-guide.md](./testing-guide.md)
**Comprehensive testing documentation**

Contains:
- Unit test specifications
- Integration test scenarios
- Migration tests
- Performance tests
- E2E test cases
- Test data management

**Audience:** QA Engineers, Developers

## Quick Reference

### What Changes?

**Database:**
- Add `deleted_at` column to: Products, Orders, OrderItems, Payments
- Add indexes on `deleted_at`
- Update unique constraints to work with soft delete

**Code:**
- Models: Add `deletedAt` field and Sequelize scopes
- Repositories: Change delete methods to UPDATE instead of DELETE
- Services: Update business logic for soft delete

**API:**
- DELETE endpoints now perform soft delete
- Existing endpoints automatically filter deleted records
- No breaking changes to API responses

### Key Benefits

1. **Data Recovery:** Restore accidentally deleted records
2. **Audit Trail:** Complete history of deletions
3. **Compliance:** Meet data retention requirements
4. **Business Intelligence:** Analyze deleted data trends
5. **Risk Mitigation:** Reduced data loss from user errors

### Implementation Timeline

- **Phase 1:** Database Migration (2-3 days)
- **Phase 2:** Code Implementation (5-7 days)
- **Phase 3:** Testing & Validation (3-4 days)
- **Phase 4:** Documentation (1-2 days)
- **Phase 5:** Deployment (1 day)

**Total:** 12-17 days

## Getting Started

### For Developers

1. Read [specification.md](./specification.md) for complete technical details
2. Follow [quickstart.md](./quickstart.md) for step-by-step implementation
3. Review [data-model.md](./data-model.md) for database changes
4. Implement tests using [testing-guide.md](./testing-guide.md)

### For Reviewers

1. Review [specification.md](./specification.md) for business rules and architecture
2. Validate data model changes in [data-model.md](./data-model.md)
3. Check testing coverage in [testing-guide.md](./testing-guide.md)

### For Stakeholders

1. Review business objectives in [specification.md](./specification.md) - Business Information section
2. Understand impact in [specification.md](./specification.md) - API Changes section
3. Review timeline and risks in [specification.md](./specification.md)

## Feature Scope

### In Scope

✅ Soft delete for Products  
✅ Soft delete for Orders (cascade to items and payment)  
✅ Soft delete for Payments  
✅ Automatic filtering of deleted records  
✅ Database migration  
✅ Repository layer updates  
✅ Service layer updates  
✅ Comprehensive testing  
✅ Documentation  

### Out of Scope (Future Enhancements)

❌ Frontend UI for restore operations  
❌ Admin dashboard for deleted records  
❌ Automated archival system  
❌ Soft delete for other entities  
❌ Complex permission system for restore  
❌ Bulk restore functionality  

## Key Decisions

### 1. Manual Soft Delete over Sequelize Paranoid
**Why:** 
- Current Sequelize config (`packages/database/src/config/database.config.ts`) is clean without paranoid mode
- Greater control, better fits functional programming patterns, more flexible for custom business rules
- Model-level scopes instead of global configuration
- No breaking changes to core database setup

### 2. Cascade Delete for Orders
**Why:** Maintains data consistency, enables complete order recovery, preserves referential integrity

### 3. Partial Indexes for Active Records
**Why:** Optimizes common queries (active records), smaller index size, better performance

### 4. Business Rule: Only DRAFT Orders Deletable
**Why:** Prevents accidental deletion of orders in progress or completed, maintains order history

## Architecture Diagrams

### Soft Delete Flow
```
DELETE /api/orders/:id
         ↓
    Handler (HTTP)
         ↓
    Service (Business Logic)
         ↓
    Repository (Data Access)
         ↓
    Transaction Start
         ↓
    UPDATE orders SET deleted_at = NOW()
    UPDATE order_items SET deleted_at = NOW()
    UPDATE payments SET deleted_at = NOW()
         ↓
    Transaction Commit
         ↓
    204 No Content
```

### Query Filter Flow
```
GET /api/products
         ↓
    Handler (HTTP)
         ↓
    Service (Business Logic)
         ↓
    Repository (Data Access)
         ↓
    Sequelize Default Scope Applied
         ↓
    WHERE deleted_at IS NULL
         ↓
    Return Active Records Only
```

## Success Criteria

### Must Have (MVP)
- [x] Specification complete
- [ ] `deletedAt` column added to all tables
- [ ] Migration created and tested
- [ ] All delete operations use soft delete
- [ ] Default scopes filter deleted records
- [ ] Unique constraints updated
- [ ] Indexes created
- [ ] Cascade delete for orders works
- [ ] All tests pass
- [ ] Documentation complete

### Quality Gates
- Zero breaking changes to API
- Test coverage > 80%
- Performance degradation < 5%
- All business rules enforced
- Complete rollback capability

## Related Documents

- [Project Constitution](../../.specify/memory/constitution.md)
- [Database Implementation](../../bakery-cms-api/DATABASE_IMPLEMENTATION.md)
- [API Documentation](../../bakery-cms-api/docs/API.md)

## Contact & Support

For questions or clarifications:
- **Technical Lead:** [Name]
- **Product Owner:** [Name]
- **Repository:** [GitHub URL]

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-17 | AI Assistant | Initial specification created |

---

## Quick Commands

```bash
# Navigate to specification
cd specs/002-soft-delete-implementation

# Read main spec
cat specification.md

# Read data model
cat data-model.md

# Follow quickstart guide
cat quickstart.md

# Review testing guide
cat testing-guide.md
```

## Implementation Checklist

Use this checklist to track implementation progress:

```markdown
## Database
- [ ] Migration file created
- [ ] Migration tested locally
- [ ] Migration tested on staging
- [ ] Indexes verified
- [ ] Constraints updated

## Models
- [ ] Product model updated
- [ ] Order model updated
- [ ] OrderItem model updated
- [ ] Payment model updated
- [ ] Scopes configured

## Repositories
- [ ] Product repository updated
- [ ] Order repository updated
- [ ] Payment repository updated
- [ ] Restore methods added

## Services
- [ ] Product service updated
- [ ] Order service updated
- [ ] Payment service updated
- [ ] Business rules enforced

## Tests
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Migration tests written
- [ ] Performance tests written
- [ ] All tests passing

## Documentation
- [ ] API docs updated
- [ ] README updated
- [ ] Comments added to code
- [ ] Migration guide written

## Deployment
- [ ] Staging deployment complete
- [ ] Smoke tests passed
- [ ] Production deployment complete
- [ ] Monitoring configured
- [ ] Team notified
```

---

**Status:** ✅ Specification Complete  
**Ready for:** Implementation  
**Next Step:** Review and approve specification
