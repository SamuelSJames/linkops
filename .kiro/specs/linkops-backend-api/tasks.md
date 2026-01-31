# Implementation Tasks

## Overview

This document breaks down the LinkOps Backend API implementation into actionable tasks organized by phase. Each task includes acceptance criteria, dependencies, and estimated effort.

## Phase 1: Project Setup and Authentication (Week 1)

### Task 1.1: Initialize FastAPI Project Structure
**Estimated Effort:** 2 hours

**Description:** Set up the basic FastAPI project structure with configuration management, logging, and directory layout.

**Acceptance Criteria:**
- [ ] Create project directory structure matching design document
- [ ] Initialize Python virtual environment with Python 3.11+
- [ ] Create requirements.txt with all dependencies (FastAPI, asyncssh, GitPython, etc.)
- [ ] Set up configuration loading from `/etc/linkops/config.ini`
- [ ] Configure structured logging to `/var/log/linkops/api.log`
- [ ] Create main.py with FastAPI application initialization
- [ ] Verify application starts and responds to health check endpoint

**Dependencies:** None

**Files to Create:**
- `backend/main.py`
- `backend/config.py`
- `backend/logging_config.py`
- `backend/requirements.txt`
- `backend/api/__init__.py`
- `backend/models/__init__.py`
- `backend/services/__init__.py`

---

### Task 1.2: Implement Database Schema and Migrations
**Estimated Effort:** 3 hours

**Description:** Create SQLite database schema with all tables defined in the design document.

**Acceptance Criteria:**
- [ ] Create database initialization script with all 8 tables
- [ ] Implement database connection management with aiosqlite
- [ ] Create database models matching schema (machines, scripts, operations, etc.)
- [ ] Add indexes for frequently queried columns (machine.id, operation.status)
- [ ] Verify database creates successfully at `/var/lib/linkops/linkops.db`
- [ ] Create database migration utility for future schema changes

**Dependencies:** Task 1.1

**Files to Create:**
- `backend/db/schema.sql`
- `backend/db/database.py`
- `backend/db/models.py`
- `backend/db/migrations.py`

---

### Task 1.3: Implement JWT Authentication
**Estimated Effort:** 4 hours

**Description:** Build authentication service with JWT token generation, validation, and lockout protection.

**Acceptance Criteria:**
- [ ] Implement AuthService class with authenticate() method
- [ ] Generate JWT tokens with 24-hour expiration
- [ ] Implement token validation middleware for protected endpoints
- [ ] Track failed login attempts in auth_attempts table
- [ ] Implement 5-attempt lockout with 5-minute duration
- [ ] Create POST /api/auth/login endpoint
- [ ] Write unit tests for authentication logic
- [ ] Write property test for Property 1 (JWT token generation)

**Dependencies:** Task 1.2

**Files to Create:**
- `backend/services/auth_service.py`
- `backend/api/auth.py`
- `backend/middleware/auth_middleware.py`
- `tests/unit/test_auth.py`
- `tests/property/test_auth_properties.py`

**Property Tests:**
- Property 1: JWT token generation and expiration
- Property 2: Failed authentication increments counter
- Property 3: Expired or invalid tokens are rejected

---

## Phase 2: Git Sync and Inventory Management (Week 1-2)

### Task 2.1: Implement Git Sync Engine
**Estimated Effort:** 5 hours

**Description:** Build Git synchronization service to clone/pull repository and parse YAML files.

**Acceptance Criteria:**
- [ ] Implement GitSyncEngine class with sync_repository() method
- [ ] Clone repository on first sync to `/var/lib/linkops/git-repo`
- [ ] Pull updates on subsequent syncs
- [ ] Handle SSH key authentication for private repositories
- [ ] Parse links.yaml with validation of required fields
- [ ] Parse scripts.yaml with validation of required fields
- [ ] Store sync history in git_sync_history table
- [ ] Create GET /api/git/status endpoint
- [ ] Create POST /api/git/sync endpoint
- [ ] Write unit tests for YAML parsing
- [ ] Write property tests for Properties 4-6

**Dependencies:** Task 1.2

**Files to Create:**
- `backend/services/git_sync_engine.py`
- `backend/api/git.py`
- `backend/parsers/yaml_parser.py`
- `tests/unit/test_git_sync.py`
- `tests/property/test_git_sync_properties.py`

**Property Tests:**
- Property 4: Git sync updates database
- Property 5: YAML validation rejects incomplete data
- Property 6: Invalid YAML produces descriptive errors

---

### Task 2.2: Implement Links/Inventory Management
**Estimated Effort:** 4 hours

**Description:** Build inventory management endpoints for querying and viewing machines.

**Acceptance Criteria:**
- [ ] Create GET /api/links endpoint returning all machines
- [ ] Create GET /api/links/{link_id} endpoint for specific machine
- [ ] Include enrollment status, SSH config, and health metrics in responses
- [ ] Implement filtering by type, status, enrollment
- [ ] Implement sorting by any column
- [ ] Write unit tests for link queries
- [ ] Write property tests for Properties 7-10

**Dependencies:** Task 2.1

**Files to Create:**
- `backend/api/links.py`
- `backend/services/inventory_service.py`
- `tests/unit/test_inventory.py`
- `tests/property/test_inventory_properties.py`

**Property Tests:**
- Property 7: Links endpoint returns complete inventory
- Property 8: Link ID lookup returns correct machine
- Property 9: Link filtering returns matching subset
- Property 10: Link sorting maintains order

---

### Task 2.3: Implement Enrollment Verification
**Estimated Effort:** 5 hours

**Description:** Build enrollment verification service to validate client ID files on target machines.

**Acceptance Criteria:**
- [ ] Implement EnrollmentVerifier class with verify_enrollment() method
- [ ] Connect to target machines via SSH
- [ ] Read `/etc/linkops/client_id` file from target
- [ ] Compare client ID with inventory enrollment ID
- [ ] Update machines table with enrollment status
- [ ] Handle SSH connection errors gracefully
- [ ] Implement batch verification for multiple machines
- [ ] Create POST /api/links/{link_id}/verify endpoint
- [ ] Write unit tests with mocked SSH connections
- [ ] Write property tests for Properties 11-12

**Dependencies:** Task 2.2

**Files to Create:**
- `backend/services/enrollment_verifier.py`
- `tests/unit/test_enrollment.py`
- `tests/property/test_enrollment_properties.py`

**Property Tests:**
- Property 11: Enrollment verification compares client IDs
- Property 12: Enrollment failures return descriptive errors

---

## Phase 3: SSH Orchestration and Operations (Week 2-3)

### Task 3.1: Implement SSH Connection Management
**Estimated Effort:** 4 hours

**Description:** Build SSH connection manager with key-based authentication and connection pooling.

**Acceptance Criteria:**
- [ ] Implement SSH connection creation with asyncssh
- [ ] Load SSH keys from `/var/lib/linkops/keys/`
- [ ] Verify SSH key permissions are 600
- [ ] Handle proxy jump connections
- [ ] Implement connection timeout (30 seconds)
- [ ] Implement connection retry logic (3 attempts with backoff)
- [ ] Write unit tests with mocked SSH connections

**Dependencies:** Task 2.3

**Files to Create:**
- `backend/services/ssh_manager.py`
- `tests/unit/test_ssh_manager.py`

---

### Task 3.2: Implement SSH Orchestrator
**Estimated Effort:** 6 hours

**Description:** Build SSH orchestration service to execute bash scripts on target machines.

**Acceptance Criteria:**
- [ ] Implement SSHOrchestrator class with execute_operation() method
- [ ] Validate all targets are enrolled before execution
- [ ] Create operation record with status "queued"
- [ ] Execute scripts with concurrency control
- [ ] Validate scripts are bash-only (reject other interpreters)
- [ ] Capture stdout and stderr in real-time
- [ ] Record exit code and execution duration
- [ ] Update operation status on completion (success/failed/partial)
- [ ] Store execution logs in operation_logs table
- [ ] Implement script execution timeout (300 seconds)
- [ ] Write unit tests for script execution
- [ ] Write property tests for Properties 13-18

**Dependencies:** Task 3.1

**Files to Create:**
- `backend/services/ssh_orchestrator.py`
- `tests/unit/test_ssh_orchestrator.py`
- `tests/property/test_ssh_orchestrator_properties.py`

**Property Tests:**
- Property 13: Operations require enrollment
- Property 14: Valid operations create queued records
- Property 15: Only bash scripts are executed
- Property 16: Script execution captures output and metadata
- Property 17: Operation status reflects execution results
- Property 18: Concurrency limits parallel executions

---

### Task 3.3: Implement Operations API Endpoints
**Estimated Effort:** 4 hours

**Description:** Build REST endpoints for operation submission and status queries.

**Acceptance Criteria:**
- [ ] Create POST /api/operations/run endpoint
- [ ] Create GET /api/operations/{operation_id} endpoint
- [ ] Create POST /api/operations/{operation_id}/stop endpoint
- [ ] Validate operation requests (scripts exist, targets enrolled)
- [ ] Return operation ID on successful submission
- [ ] Return complete operation details including logs
- [ ] Implement operation cancellation
- [ ] Write integration tests for operation endpoints

**Dependencies:** Task 3.2

**Files to Create:**
- `backend/api/operations.py`
- `tests/integration/test_operations_api.py`

---

### Task 3.4: Implement Server-Sent Events for Operations
**Estimated Effort:** 5 hours

**Description:** Build SSE streaming for real-time operation monitoring.

**Acceptance Criteria:**
- [ ] Create GET /api/operations/{operation_id}/events SSE endpoint
- [ ] Stream operation events (script start, output, completion)
- [ ] Format events according to SSE specification
- [ ] Close stream when operation completes
- [ ] Handle client disconnection gracefully
- [ ] Support multiple concurrent SSE connections
- [ ] Write integration tests for SSE streaming
- [ ] Write property tests for Property 19-20

**Dependencies:** Task 3.3

**Files to Create:**
- `backend/api/sse.py`
- `backend/services/sse_manager.py`
- `tests/integration/test_sse.py`
- `tests/property/test_sse_properties.py`

**Property Tests:**
- Property 19: SSE streams operation events
- Property 20: SSE connections close on completion

---

## Phase 4: Terminal Sessions and WebSocket (Week 3-4)

### Task 4.1: Implement Terminal Manager
**Estimated Effort:** 5 hours

**Description:** Build terminal workspace manager for multi-pane SSH sessions.

**Acceptance Criteria:**
- [ ] Implement TerminalManager class with create_workspace() method
- [ ] Generate unique workspace IDs
- [ ] Support layouts: single, grid2x2, grid1x3, grid2x1
- [ ] Implement pane assignment with enrollment validation
- [ ] Create SSH PTY sessions for panes
- [ ] Store workspace and pane data in database
- [ ] Implement workspace cleanup on closure
- [ ] Write unit tests for workspace management
- [ ] Write property tests for Properties 21-24

**Dependencies:** Task 3.1

**Files to Create:**
- `backend/services/terminal_manager.py`
- `tests/unit/test_terminal_manager.py`
- `tests/property/test_terminal_properties.py`

**Property Tests:**
- Property 21: Workspace IDs are unique
- Property 22: Pane assignments require enrollment
- Property 23: WebSocket routes I/O bidirectionally
- Property 24: Pane disconnection cleans up resources

---

### Task 4.2: Implement WebSocket Handler
**Estimated Effort:** 6 hours

**Description:** Build WebSocket handler for terminal I/O streaming.

**Acceptance Criteria:**
- [ ] Create WS /api/terminal/workspaces/{workspace_id}/ws endpoint
- [ ] Authenticate WebSocket connections with JWT
- [ ] Route stdin from client to SSH session
- [ ] Route stdout/stderr from SSH session to client
- [ ] Handle multiple panes in single WebSocket connection
- [ ] Implement message format: {pane, type, data}
- [ ] Handle WebSocket disconnection and cleanup
- [ ] Implement idle timeout (3600 seconds)
- [ ] Write integration tests for WebSocket
- [ ] Test concurrent WebSocket connections

**Dependencies:** Task 4.1

**Files to Create:**
- `backend/api/terminal.py`
- `backend/services/websocket_handler.py`
- `tests/integration/test_websocket.py`

---

### Task 4.3: Implement Terminal API Endpoints
**Estimated Effort:** 3 hours

**Description:** Build REST endpoints for terminal workspace management.

**Acceptance Criteria:**
- [ ] Create POST /api/terminal/workspaces endpoint
- [ ] Create PUT /api/terminal/workspaces/{id}/panes endpoint
- [ ] Create POST /api/terminal/workspaces/{id}/connect-all endpoint
- [ ] Validate workspace creation requests
- [ ] Validate pane assignments (targets enrolled)
- [ ] Return workspace details on creation
- [ ] Write integration tests for terminal endpoints

**Dependencies:** Task 4.2

**Files to Create:**
- `backend/api/terminal.py` (extend)
- `tests/integration/test_terminal_api.py`

---

## Phase 5: Table Queries and Health Monitoring (Week 4)

### Task 5.1: Implement Table Query Engine
**Estimated Effort:** 5 hours

**Description:** Build unified table query engine for Excel-like data access.

**Acceptance Criteria:**
- [ ] Implement TableQueryEngine class with query_table() method
- [ ] Validate table names against allowed list
- [ ] Implement column selection
- [ ] Implement filters with operators: eq, in, gt, lt, gte, lte
- [ ] Implement sorting by multiple columns
- [ ] Implement cursor-based pagination
- [ ] Create POST /api/tables/query endpoint
- [ ] Support tables: tbl_links, tbl_operations_history, tbl_recent_activity, tbl_infrastructure, tbl_link_health
- [ ] Write unit tests for query processing
- [ ] Write property tests for Properties 25-27

**Dependencies:** Task 2.2, Task 3.3

**Files to Create:**
- `backend/services/table_query_engine.py`
- `backend/api/tables.py`
- `tests/unit/test_table_query.py`
- `tests/property/test_table_query_properties.py`

**Property Tests:**
- Property 25: Table queries validate table names
- Property 26: Table queries apply filters, sorting, and pagination
- Property 27: Table queries include metadata

---

### Task 5.2: Implement Health Monitoring
**Estimated Effort:** 4 hours

**Description:** Build health monitoring service to check machine connectivity and latency.

**Acceptance Criteria:**
- [ ] Implement health check service with periodic checks
- [ ] Attempt SSH connection to each machine
- [ ] Measure connection latency
- [ ] Update machine status (online/offline)
- [ ] Store last_seen timestamp
- [ ] Run health checks every 5 minutes
- [ ] Handle health check failures gracefully
- [ ] Write unit tests for health checks
- [ ] Write property test for Property 28

**Dependencies:** Task 3.1

**Files to Create:**
- `backend/services/health_monitor.py`
- `tests/unit/test_health_monitor.py`
- `tests/property/test_health_properties.py`

**Property Tests:**
- Property 28: Health checks update machine status

---

## Phase 6: Configuration and Deployment (Week 4-5)

### Task 6.1: Implement Configuration Management
**Estimated Effort:** 3 hours

**Description:** Build configuration loading and validation for secrets and settings.

**Acceptance Criteria:**
- [ ] Load configuration from `/etc/linkops/config.ini`
- [ ] Parse secrets.ini from Git repository
- [ ] Validate SSH key permissions (must be 600)
- [ ] Validate all required configuration values present
- [ ] Fail startup if configuration invalid
- [ ] Write unit tests for configuration loading
- [ ] Write property tests for Properties 29-30

**Dependencies:** Task 1.1

**Files to Create:**
- `backend/config.py` (extend)
- `backend/services/secrets_manager.py`
- `tests/unit/test_config.py`
- `tests/property/test_config_properties.py`

**Property Tests:**
- Property 29: SSH key permissions are validated
- Property 30: Secrets parsing extracts configuration

---

### Task 6.2: Implement Error Handling and Logging
**Estimated Effort:** 4 hours

**Description:** Build comprehensive error handling and structured logging.

**Acceptance Criteria:**
- [ ] Implement structured error responses for all API endpoints
- [ ] Log all errors with timestamp, context, and stack trace
- [ ] Log SSH connection failures with target and error details
- [ ] Log Git sync failures with repository URL and error
- [ ] Log operation failures with operation ID and reason
- [ ] Implement log rotation (100MB max, 5 backups)
- [ ] Write unit tests for error handling
- [ ] Write property tests for Properties 35-36

**Dependencies:** Task 1.1

**Files to Create:**
- `backend/middleware/error_handler.py`
- `backend/logging_config.py` (extend)
- `tests/unit/test_error_handling.py`
- `tests/property/test_error_properties.py`

**Property Tests:**
- Property 35: Errors are logged with context
- Property 36: API errors return structured responses

---

### Task 6.3: Implement Operation History and Audit Trail
**Estimated Effort:** 3 hours

**Description:** Build operation history queries with filtering and audit trail.

**Acceptance Criteria:**
- [ ] Store completed operations in database
- [ ] Query operation history sorted by start time descending
- [ ] Include all execution logs and results in operation view
- [ ] Filter operations by status
- [ ] Filter operations by date range
- [ ] Write unit tests for history queries
- [ ] Write property tests for Properties 31-34

**Dependencies:** Task 3.3

**Files to Create:**
- `backend/services/audit_service.py`
- `tests/unit/test_audit.py`
- `tests/property/test_audit_properties.py`

**Property Tests:**
- Property 31: Completed operations are stored
- Property 32: Operation history is sorted by time
- Property 33: Operation views include complete data
- Property 34: Operation filtering returns matching subset

---

### Task 6.4: Create Systemd Service
**Estimated Effort:** 2 hours

**Description:** Create systemd service configuration for LinkOps API.

**Acceptance Criteria:**
- [ ] Create linkopsd.service file
- [ ] Configure service to run as linkops user
- [ ] Set working directory to /var/lib/linkops
- [ ] Configure automatic restart on failure
- [ ] Implement graceful shutdown on SIGTERM
- [ ] Log startup and shutdown events
- [ ] Test service start/stop/restart
- [ ] Write property test for Property 37

**Dependencies:** All previous tasks

**Files to Create:**
- `deployment/linkopsd.service`
- `deployment/install.sh`
- `tests/property/test_service_properties.py`

**Property Tests:**
- Property 37: SIGTERM triggers graceful shutdown

---

### Task 6.5: Create Deployment Scripts
**Estimated Effort:** 3 hours

**Description:** Build deployment and installation scripts for Ubuntu LXC container.

**Acceptance Criteria:**
- [ ] Create installation script for Ubuntu 24.04
- [ ] Install Python 3.11+ and dependencies
- [ ] Create linkops user and group
- [ ] Create directory structure (/etc/linkops, /var/lib/linkops)
- [ ] Set correct permissions on directories and files
- [ ] Install systemd service
- [ ] Generate JWT secret
- [ ] Create initial config.ini
- [ ] Test installation on clean Ubuntu 24.04 LXC

**Dependencies:** Task 6.4

**Files to Create:**
- `deployment/install.sh`
- `deployment/uninstall.sh`
- `deployment/config.ini.template`
- `deployment/README.md`

---

## Phase 7: Testing and Documentation (Week 5)

### Task 7.1: Complete Property-Based Tests
**Estimated Effort:** 6 hours

**Description:** Ensure all 37 correctness properties have property-based tests.

**Acceptance Criteria:**
- [ ] All 37 properties have corresponding Hypothesis tests
- [ ] Each test runs minimum 100 iterations
- [ ] All tests include proper docstrings with feature name and property statement
- [ ] All tests pass consistently
- [ ] Property test coverage: 100%

**Dependencies:** All implementation tasks

**Files to Review:**
- All `tests/property/test_*_properties.py` files

---

### Task 7.2: Complete Integration Tests
**Estimated Effort:** 5 hours

**Description:** Build comprehensive integration tests for all API endpoints.

**Acceptance Criteria:**
- [ ] Test all REST endpoints with valid and invalid inputs
- [ ] Test authentication middleware on protected endpoints
- [ ] Test WebSocket connection lifecycle
- [ ] Test SSE event streaming
- [ ] Test error responses match expected format
- [ ] Integration test coverage: All API endpoints

**Dependencies:** All implementation tasks

**Files to Create:**
- `tests/integration/test_api_endpoints.py` (extend)
- `tests/integration/test_websocket.py` (extend)
- `tests/integration/test_sse.py` (extend)

---

### Task 7.3: Create API Documentation
**Estimated Effort:** 4 hours

**Description:** Generate comprehensive API documentation with examples.

**Acceptance Criteria:**
- [ ] Document all REST endpoints with request/response examples
- [ ] Document WebSocket protocol and message format
- [ ] Document SSE event format
- [ ] Document authentication flow
- [ ] Document error codes and responses
- [ ] Generate OpenAPI/Swagger documentation
- [ ] Create Postman collection for testing

**Dependencies:** All implementation tasks

**Files to Create:**
- `docs/API.md`
- `docs/AUTHENTICATION.md`
- `docs/WEBSOCKET.md`
- `docs/postman_collection.json`

---

### Task 7.4: Create Deployment Documentation
**Estimated Effort:** 3 hours

**Description:** Write comprehensive deployment and operations documentation.

**Acceptance Criteria:**
- [ ] Document installation process for Ubuntu 24.04 LXC
- [ ] Document configuration options in config.ini
- [ ] Document Git repository setup
- [ ] Document SSH key management
- [ ] Document systemd service management
- [ ] Document troubleshooting common issues
- [ ] Document backup and recovery procedures

**Dependencies:** Task 6.5

**Files to Create:**
- `docs/DEPLOYMENT.md`
- `docs/CONFIGURATION.md`
- `docs/TROUBLESHOOTING.md`
- `docs/OPERATIONS.md`

---

## Testing Checklist

### Unit Tests
- [ ] Authentication service
- [ ] Git sync engine
- [ ] YAML parser
- [ ] Enrollment verifier
- [ ] SSH manager
- [ ] SSH orchestrator
- [ ] Terminal manager
- [ ] Table query engine
- [ ] Health monitor
- [ ] Configuration loader
- [ ] Error handler

### Property-Based Tests
- [ ] All 37 correctness properties implemented
- [ ] Minimum 100 iterations per property
- [ ] Proper docstring tagging

### Integration Tests
- [ ] All REST endpoints
- [ ] WebSocket connections
- [ ] SSE streaming
- [ ] Authentication middleware
- [ ] Error responses

### Coverage Goals
- [ ] Line coverage: 85%+
- [ ] Branch coverage: 80%+
- [ ] Property test coverage: 100%
- [ ] Integration test coverage: All endpoints

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation complete
- [ ] Security audit completed

### Deployment Steps
- [ ] Create Ubuntu 24.04 LXC container
- [ ] Run installation script
- [ ] Configure Git repository access
- [ ] Copy SSH keys to /var/lib/linkops/keys/
- [ ] Set SSH key permissions to 600
- [ ] Update config.ini with production values
- [ ] Start linkopsd service
- [ ] Verify service is running
- [ ] Test authentication endpoint
- [ ] Trigger initial Git sync
- [ ] Verify machines loaded from inventory
- [ ] Test enrollment verification
- [ ] Test operation execution
- [ ] Test terminal sessions

### Post-Deployment
- [ ] Monitor logs for errors
- [ ] Verify health checks running
- [ ] Test all API endpoints
- [ ] Verify Git sync runs periodically
- [ ] Set up log rotation
- [ ] Configure backups
- [ ] Document production configuration

---

## Estimated Timeline

- **Phase 1:** 9 hours (1.5 days)
- **Phase 2:** 14 hours (2 days)
- **Phase 3:** 19 hours (2.5 days)
- **Phase 4:** 14 hours (2 days)
- **Phase 5:** 9 hours (1.5 days)
- **Phase 6:** 15 hours (2 days)
- **Phase 7:** 18 hours (2.5 days)

**Total Estimated Effort:** 98 hours (~12-13 working days for one developer)

---

## Notes

- All tasks should be completed in order within each phase
- Property-based tests should be written alongside unit tests
- Integration tests should be written after API endpoints are complete
- Code reviews should happen at the end of each phase
- Documentation should be updated continuously throughout development
