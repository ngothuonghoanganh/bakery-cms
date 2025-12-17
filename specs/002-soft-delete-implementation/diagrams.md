# Soft Delete Implementation - Visual Diagrams

This document contains detailed visual diagrams for the soft delete implementation.

## 1. Entity Relationship Diagram with Soft Delete

```mermaid
erDiagram
    PRODUCT ||--o{ ORDER_ITEM : "referenced by"
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER ||--|| PAYMENT : has
    
    PRODUCT {
        uuid id PK "Primary Key"
        string name "Product name"
        text description "Optional description"
        decimal price "Price in currency"
        string category "Product category"
        enum business_type "retail/wholesale"
        enum status "available/unavailable"
        string image_url "Product image URL"
        timestamp created_at "Creation timestamp"
        timestamp updated_at "Last update timestamp"
        timestamp deleted_at "SOFT DELETE: NULL or deletion timestamp"
    }
    
    ORDER {
        uuid id PK "Primary Key"
        string order_number UK "Unique order number"
        enum order_type "temporary/permanent"
        enum business_model "retail/wholesale"
        decimal total_amount "Total order amount"
        enum status "draft/pending/paid/cancelled"
        string customer_name "Customer name"
        string customer_phone "Customer phone"
        text notes "Order notes"
        timestamp confirmed_at "Order confirmation time"
        timestamp created_at "Creation timestamp"
        timestamp updated_at "Last update timestamp"
        timestamp deleted_at "SOFT DELETE: NULL or deletion timestamp"
    }
    
    ORDER_ITEM {
        uuid id PK "Primary Key"
        uuid order_id FK "Foreign key to ORDER"
        uuid product_id FK "Foreign key to PRODUCT"
        integer quantity "Item quantity"
        decimal unit_price "Price per unit"
        decimal subtotal "quantity * unit_price"
        text notes "Item notes"
        timestamp created_at "Creation timestamp"
        timestamp updated_at "Last update timestamp"
        timestamp deleted_at "SOFT DELETE: NULL or deletion timestamp"
    }
    
    PAYMENT {
        uuid id PK "Primary Key"
        uuid order_id FK-UK "Foreign key to ORDER (unique)"
        decimal amount "Payment amount"
        enum method "cash/bank_transfer/vietqr"
        enum status "pending/paid/failed"
        string transaction_id "External transaction ID"
        text vietqr_data "VietQR JSON data"
        timestamp paid_at "Payment completion time"
        text notes "Payment notes"
        timestamp created_at "Creation timestamp"
        timestamp updated_at "Last update timestamp"
        timestamp deleted_at "SOFT DELETE: NULL or deletion timestamp"
    }
```

## 2. Soft Delete Flow - Sequence Diagrams

### 2.1 Product Soft Delete Flow

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Handler
    participant Service
    participant Repository
    participant Database
    
    Client->>Handler: DELETE /api/products/:id
    activate Handler
    
    Handler->>Service: deleteProduct(id)
    activate Service
    
    Service->>Repository: findById(id)
    activate Repository
    Repository->>Database: SELECT * FROM products<br/>WHERE id=? AND deleted_at IS NULL
    Database-->>Repository: Product record
    Repository-->>Service: Product
    deactivate Repository
    
    alt Product exists
        Service->>Repository: delete(id)
        activate Repository
        Repository->>Database: UPDATE products<br/>SET deleted_at=NOW()<br/>WHERE id=?
        Database-->>Repository: Success (1 row)
        Repository-->>Service: true
        deactivate Repository
        
        Service-->>Handler: ok(void)
        Handler-->>Client: 204 No Content
    else Product not found
        Service-->>Handler: err(NotFoundError)
        Handler-->>Client: 404 Not Found
    end
    
    deactivate Service
    deactivate Handler
```

### 2.2 Order Cascade Soft Delete Flow

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Handler
    participant Service
    participant Repository
    participant Database
    
    Client->>Handler: DELETE /api/orders/:id
    activate Handler
    
    Handler->>Service: deleteOrder(id)
    activate Service
    
    Service->>Repository: findById(id)
    Repository->>Database: SELECT * FROM orders<br/>WHERE id=? AND deleted_at IS NULL
    Database-->>Repository: Order record
    Repository-->>Service: Order
    
    alt Order status is DRAFT
        Service->>Repository: delete(id)
        activate Repository
        
        Note over Repository,Database: BEGIN TRANSACTION
        
        Repository->>Database: UPDATE orders<br/>SET deleted_at=NOW()<br/>WHERE id=?
        Database-->>Repository: Success
        
        Repository->>Database: UPDATE order_items<br/>SET deleted_at=NOW()<br/>WHERE order_id=?
        Database-->>Repository: Success
        
        Repository->>Database: UPDATE payments<br/>SET deleted_at=NOW()<br/>WHERE order_id=?
        Database-->>Repository: Success
        
        Note over Repository,Database: COMMIT TRANSACTION
        
        Repository-->>Service: true
        deactivate Repository
        
        Service-->>Handler: ok(void)
        Handler-->>Client: 204 No Content
    else Order status is not DRAFT
        Service-->>Handler: err(BusinessRuleError)
        Handler-->>Client: 400 Bad Request<br/>"Cannot delete non-draft order"
    end
    
    deactivate Service
    deactivate Handler
```

### 2.3 Restore Soft-Deleted Record Flow

```mermaid
sequenceDiagram
    autonumber
    participant Admin
    participant Handler
    participant Service
    participant Repository
    participant Database
    
    Admin->>Handler: POST /api/admin/products/:id/restore
    activate Handler
    
    Handler->>Service: restoreProduct(id)
    activate Service
    
    Service->>Repository: restore(id)
    activate Repository
    
    Note over Repository: Use 'withDeleted' scope
    
    Repository->>Database: SELECT * FROM products<br/>WHERE id=?<br/>(including deleted)
    Database-->>Repository: Product with deleted_at set
    
    alt Product is soft-deleted
        Repository->>Database: UPDATE products<br/>SET deleted_at=NULL<br/>WHERE id=?
        Database-->>Repository: Success
        Repository-->>Service: true
        
        Service->>Repository: findById(id)
        Repository->>Database: SELECT * FROM products<br/>WHERE id=? AND deleted_at IS NULL
        Database-->>Repository: Restored product
        Repository-->>Service: Product
        
        Service-->>Handler: ok(ProductResponseDto)
        Handler-->>Admin: 200 OK with product data
    else Product not deleted
        Repository-->>Service: false
        Service-->>Handler: err(NotFoundError)
        Handler-->>Admin: 404 Not Found
    end
    
    deactivate Repository
    deactivate Service
    deactivate Handler
```

## 3. State Diagram - Record Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active: Create Record<br/>(deletedAt = NULL)
    
    Active --> Active: Update Record<br/>(deletedAt remains NULL)
    
    Active --> SoftDeleted: Soft Delete<br/>(SET deletedAt = NOW())
    
    SoftDeleted --> Active: Restore<br/>(SET deletedAt = NULL)
    
    SoftDeleted --> PermanentlyDeleted: Force Delete<br/>(DELETE FROM table)
    
    PermanentlyDeleted --> [*]
    
    state Active {
        [*] --> Visible
        Visible --> Queryable: Default queries
        Queryable --> Modifiable: Can update/delete
    }
    
    state SoftDeleted {
        [*] --> Hidden
        Hidden --> AdminOnly: Admin scope queries
        AdminOnly --> Restorable: Can be restored
    }
    
    state PermanentlyDeleted {
        [*] --> Gone
        note right of Gone: Cannot be recovered
    }
    
    note right of Active
        deletedAt = NULL
        Visible in all standard queries
        Can be updated and deleted
    end note
    
    note right of SoftDeleted
        deletedAt = timestamp
        Hidden from standard queries
        Visible with 'withDeleted' scope
        Can be restored
    end note
    
    note right of PermanentlyDeleted
        Record removed from database
        Cannot be recovered
        Only for admin/maintenance
    end note
```

## 4. Component Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        CLI[API Clients]
        WEB[Web Frontend]
    end
    
    subgraph "API Layer"
        HANDLER[HTTP Handlers]
        VALID[Validators]
        MW[Middleware]
    end
    
    subgraph "Business Layer"
        SVC[Services]
        BR[Business Rules]
        MAPPER[Data Mappers]
    end
    
    subgraph "Data Layer"
        REPO[Repositories]
        SCOPE[Sequelize Scopes]
        MODEL[Models]
    end
    
    subgraph "Database Layer"
        DB[(MySQL Database)]
        IDX[Indexes on deleted_at]
        CONST[Partial Unique Constraints]
    end
    
    CLI --> HANDLER
    WEB --> HANDLER
    HANDLER --> VALID
    HANDLER --> MW
    HANDLER --> SVC
    
    SVC --> BR
    SVC --> MAPPER
    SVC --> REPO
    
    REPO --> SCOPE
    SCOPE --> MODEL
    MODEL --> DB
    
    DB --> IDX
    DB --> CONST
    
    style SCOPE fill:#f9f,stroke:#333,stroke-width:3px
    style IDX fill:#bbf,stroke:#333,stroke-width:2px
    style BR fill:#bfb,stroke:#333,stroke-width:2px
    
    classDef highlight fill:#ff9,stroke:#333,stroke-width:4px
    class SCOPE,IDX,BR highlight
```

## 5. Query Performance - Before and After

```mermaid
graph LR
    subgraph "Before Soft Delete"
        Q1[Query: SELECT *<br/>FROM products<br/>WHERE category='cookies']
        Q1 --> IDX1[Uses: idx_category]
        IDX1 --> R1[Returns: 100 rows<br/>Time: 10ms]
    end
    
    subgraph "After Soft Delete"
        Q2[Query: SELECT *<br/>FROM products<br/>WHERE category='cookies'<br/>AND deleted_at IS NULL]
        Q2 --> IDX2[Uses: idx_category<br/>+ idx_deleted_at]
        IDX2 --> R2[Returns: 95 rows<br/>Time: 10.5ms<br/>+5% overhead]
    end
    
    style R2 fill:#bfb
```

## 6. Database Index Strategy

```mermaid
graph TB
    subgraph "Products Table"
        P[products table]
        P --> PI1[idx_products_id<br/>PRIMARY KEY]
        P --> PI2[idx_products_deleted_at<br/>REGULAR INDEX]
        P --> PI3[idx_products_active<br/>PARTIAL INDEX<br/>WHERE deleted_at IS NULL]
        P --> PI4[idx_products_category<br/>EXISTING INDEX]
    end
    
    subgraph "Orders Table"
        O[orders table]
        O --> OI1[idx_orders_id<br/>PRIMARY KEY]
        O --> OI2[idx_orders_deleted_at<br/>REGULAR INDEX]
        O --> OI3[idx_orders_active<br/>PARTIAL INDEX<br/>WHERE deleted_at IS NULL]
        O --> OI4[idx_orders_order_number_unique<br/>UNIQUE PARTIAL INDEX<br/>WHERE deleted_at IS NULL]
    end
    
    subgraph "Query Optimization"
        QO1[Active records queries<br/>Use: Partial Indexes<br/>Benefit: Faster, smaller]
        QO2[Admin deleted queries<br/>Use: Regular deleted_at index<br/>Benefit: Find deleted records]
        QO3[Count operations<br/>Use: Partial indexes<br/>Benefit: Count only active]
    end
    
    PI3 -.->|Optimizes| QO1
    OI3 -.->|Optimizes| QO1
    PI2 -.->|Optimizes| QO2
    OI2 -.->|Optimizes| QO2
    
    style PI3 fill:#bfb
    style OI3 fill:#bfb
    style QO1 fill:#ff9
```

## 7. Cascade Delete Visualization

```mermaid
graph TD
    O[Order<br/>id: 123<br/>order_number: ORD-001<br/>deleted_at: NULL]
    OI1[OrderItem 1<br/>id: 456<br/>quantity: 2<br/>deleted_at: NULL]
    OI2[OrderItem 2<br/>id: 789<br/>quantity: 1<br/>deleted_at: NULL]
    P[Payment<br/>id: 999<br/>amount: 100.00<br/>deleted_at: NULL]
    
    O --> OI1
    O --> OI2
    O --> P
    
    SD[Soft Delete Order 123<br/>SET deleted_at = NOW()]
    
    SD -.->|Cascades| O2[Order<br/>deleted_at: 2024-12-17]
    SD -.->|Cascades| OI1_2[OrderItem 1<br/>deleted_at: 2024-12-17]
    SD -.->|Cascades| OI2_2[OrderItem 2<br/>deleted_at: 2024-12-17]
    SD -.->|Cascades| P2[Payment<br/>deleted_at: 2024-12-17]
    
    O --> SD
    
    style SD fill:#f99,stroke:#333,stroke-width:3px
    style O2 fill:#fcc
    style OI1_2 fill:#fcc
    style OI2_2 fill:#fcc
    style P2 fill:#fcc
```

## 8. Data Retention Timeline

```mermaid
gantt
    title Data Lifecycle with Soft Delete
    dateFormat YYYY-MM-DD
    section Active Records
    Created and Active           :active, 2024-01-01, 180d
    section Soft Deleted
    Soft Deleted (Recoverable)   :deleted, 2024-06-30, 365d
    section Archived
    Moved to Archive (Optional)  :archive, 2025-06-30, 1825d
    section Purged
    Permanent Delete             :purge, 2030-06-30, 1d
```

## 9. Transaction Flow for Cascade Delete

```mermaid
flowchart TD
    START([Delete Order Request]) --> CHECK{Order Exists?}
    CHECK -->|No| ERR404[Return 404 Not Found]
    CHECK -->|Yes| DRAFT{Status = DRAFT?}
    
    DRAFT -->|No| ERR400[Return 400 Bad Request<br/>Only DRAFT can be deleted]
    DRAFT -->|Yes| TXN[BEGIN TRANSACTION]
    
    TXN --> DEL_ORD[UPDATE orders<br/>SET deleted_at = NOW()]
    DEL_ORD --> DEL_ITEMS[UPDATE order_items<br/>SET deleted_at = NOW()]
    DEL_ITEMS --> DEL_PAY[UPDATE payments<br/>SET deleted_at = NOW()]
    
    DEL_PAY --> COMMIT{Commit OK?}
    COMMIT -->|Success| SUCCESS[COMMIT TRANSACTION]
    COMMIT -->|Error| ROLLBACK[ROLLBACK TRANSACTION]
    
    SUCCESS --> RESP204[Return 204 No Content]
    ROLLBACK --> ERR500[Return 500 Internal Error]
    
    ERR404 --> END([End])
    ERR400 --> END
    ERR500 --> END
    RESP204 --> END
    
    style TXN fill:#9cf
    style SUCCESS fill:#9f9
    style ROLLBACK fill:#f99
```

## 10. Monitoring Dashboard Layout

```mermaid
graph TB
    subgraph "Soft Delete Monitoring Dashboard"
        M1[Active vs Deleted Records]
        M2[Deletion Rate Timeline]
        M3[Query Performance]
        M4[Database Size Growth]
        M5[Top Deleted Entities]
        M6[Restore Operations]
        
        M1 --> CHART1[Bar Chart:<br/>Active | Deleted per table]
        M2 --> CHART2[Line Chart:<br/>Deletions over time]
        M3 --> CHART3[Line Chart:<br/>Query latency p95/p99]
        M4 --> CHART4[Area Chart:<br/>Table sizes over time]
        M5 --> CHART5[Table:<br/>Most deleted records]
        M6 --> CHART6[Counter:<br/>Restore operations count]
    end
    
    subgraph "Alerts"
        A1[High deletion rate]
        A2[Performance degradation]
        A3[Database size threshold]
    end
    
    M2 -.->|Triggers| A1
    M3 -.->|Triggers| A2
    M4 -.->|Triggers| A3
    
    style M1 fill:#9cf
    style M2 fill:#9cf
    style M3 fill:#9cf
    style A1 fill:#f99
    style A2 fill:#f99
    style A3 fill:#f99
```

## 11. Rollback Strategy

```mermaid
flowchart TD
    ISSUE[Issue Detected in Production]
    
    ISSUE --> ASSESS{Severity?}
    
    ASSESS -->|Critical| IMM[Immediate Rollback]
    ASSESS -->|High| EVAL[Evaluate Impact]
    ASSESS -->|Low| MON[Monitor and Log]
    
    IMM --> RB_CODE[Rollback Code Deployment]
    RB_CODE --> RB_MIG{Rollback Migration?}
    
    RB_MIG -->|Yes| RB_DB[Execute Migration Down]
    RB_MIG -->|No| VERIFY_CODE[Verify Code Rollback]
    
    RB_DB --> VERIFY_DB[Verify Database State]
    VERIFY_DB --> VERIFY_CODE
    
    VERIFY_CODE --> TEST[Run Smoke Tests]
    TEST --> OK{Tests Pass?}
    
    OK -->|Yes| COMPLETE[Rollback Complete]
    OK -->|No| ESCALATE[Escalate to Team]
    
    EVAL --> FIX{Quick Fix Available?}
    FIX -->|Yes| HOTFIX[Deploy Hotfix]
    FIX -->|No| IMM
    
    HOTFIX --> TEST
    
    MON --> LOG[Document Issue]
    LOG --> PLAN[Plan Fix for Next Release]
    
    style ISSUE fill:#f99
    style IMM fill:#f66
    style COMPLETE fill:#9f9
    style ESCALATE fill:#f99
```

## Usage Notes

These diagrams are created using Mermaid syntax and can be rendered in:
- GitHub/GitLab markdown files
- VS Code with Mermaid preview extensions
- Documentation sites (MkDocs, Docusaurus, etc.)
- Mermaid Live Editor: https://mermaid.live

To edit these diagrams:
1. Copy the mermaid code block
2. Paste into Mermaid Live Editor
3. Make modifications
4. Copy back to this file

To export as images:
1. Open in Mermaid Live Editor
2. Use export function to save as PNG/SVG
3. Include images in presentation materials
