# LinkOps Backend - Implementation Checklist

Use this checklist to track implementation progress. Check off items as you complete them.

---

## Phase 1: Project Setup and Authentication (9 hours)

### Task 1.1: Initialize FastAPI Project Structure (2 hours)
- [ ] Create project directory structure
- [ ] Initialize Python virtual environment with Python 3.11+
- [ ] Create requirements.txt with all dependencies
- [ ] Set up configuration loading from `/etc/linkops/config.ini`
- [ ] Configure structured logging to `/var/log/linkops/api.log`
- [ ] Create main.py with FastAPI application initialization
- [ ] Verify application starts and responds to health check endpoint

**Files Created:**
- [ ] `backend/main.py`
- [ ] `backend/config.py`
- [ ] `backend/logging_config.py`
- [ ] `backend/api/__init__.py`
- [ ] `backend/models/__init__.py`
- [ ] `backend/services/__init__.py`

---

### Task 1.2: Implement Database Schema and Migrations (3 hours)
- [ ] Create database initialization script with all 8 tables
- [ ] Implement database connection management with aiosqlite
- [ ] Create database models matching schema
- [ ] Add indexes for frequently queried columns
- [ ] Verify database creates successfully at `/var/lib/linkops/linkops.db`
- [ ] Create database migration utility

**Files Created:**
- [ ] `backend/db/schema.sql`
- [ ] `backend/db/database.py`
- [ ] `backend/db/models.py`
- [ ] `backend/db/migrations.py`

---

### Task 1.3: Implement JWT Authentication (4 hours)
- [ ] Implement AuthService class with authenticate() method
- [ ] Generate JWT tokens with 24-hour expiration
- [ ] Implement token validation middleware
- [ ] Track failed login attempts in auth_attempts table
- [ ] Implement 5-attempt lockout with 5-minute duration
- [ ] Create POST /api/auth/login endpoint
- [ ] Write unit tests for authentication logic
- [ ] Write property test for Property 1 (JWT token generation)

**Files Created:**
- [ ] `backend/services/auth_service.py`
- [ ] `backend/api/auth.py`
- [ ] `backend/middleware/auth_middleware.py`
- [ ] `tests/unit/test_auth.py`
- [ ] `tests/property/test_auth_properties.py`

**Property Tests:**
- [ ] Property 1: JWT token generation and expiration
- [ ] Property 2: Failed authentication increments counter
- [ ] Property 3: Expired or invalid tokens are rejected

---

## Phase 2: Git Sync and Inventory Management (14 hours)

### Task 2.1: Implement Git Sync Engine (5 hours)
- [ ] Implement GitSyncEngine class with sync_repository() method
- [ ] Clone repository on first sync
- [ ] Pull updates on subsequent syncs
- [ ] Handle SSH key authentication
- [ ] Parse links.yaml with validation
- [ ] Parse scripts.yaml with validation
- [ ] Store sync history in git_sync_history table
- [ ] Create GET /api/git/status endpoint
- [ ] Create POST /api/git/sync endpoint
- [ ] Write unit tests for YAML parsing
- [ ] Write property tests for Properties 4-6

**Files Created:**
- [ ] `backend/services/git_sync_engine.py`
- [ ] `backend/api/git.py`
- [ ] `backend/parsers/yaml_parser.py`
- [ ] `tests/unit/test_git_sync.py`
- [ ] `tests/property/test_git_sync_properties.py`

**Property Tests:**
- [ ] Property 4: Git sync updates database
- [ ] Property 5: YAML validation rejects incomplete data
- [ ] Property 6: Invalid YAML produces descriptive errors

---

### Task 2.2: Implement Links/Inventory Management (4 hours)
- [ ] Create GET /api/links endpoint
- [ ] Create GET /api/links/{link_id} endpoint
- [ ] Include enrollment status, SSH config, health metrics
- [ ] Implement filtering by type, status, enrollment
- [ ] Implement sorting by any column
- [ ] Write unit tests for link queries
- [ ] Write property tests for Properties 7-10

**Files Created:**
- [ ] `backend/api/links.py`
- [ ] `backend/services/inventory_service.py`
- [ ] `tests/unit/test_inventory.py`
- [ ] `tests/property/test_inventory_properties.py`

**Property Tests:**
- [ ] Property 7: Links endpoint returns complete inventory
- [ ] Property 8: Link ID lookup returns correct machine
- [ ] Property 9: Link filtering returns matching subset
- [ ] Property 10: Link sorting maintains order

---

### Task 2.3: Implement Enrollment Verification (5 hours)
- [ ] Implement EnrollmentVerifier class
- [ ] Connect to target machines via SSH
- [ ] Read `/etc/linkops/client_id` file
- [ ] Compare client ID with inventory
- [ ] Update machines table with enrollment status
- [ ] Handle SSH connection errors gracefully
- [ ] Implement batch verification
- [ ] Create POST /api/links/{link_id}/verify endpoint
- [ ] Write unit tests with mocked SSH
- [ ] Write property tests for Properties 11-12

**Files Created:**
- [ ] `backend/services/enrollment_verifier.py`
- [ ] `tests/unit/test_enrollment.py`
- [ ] `tests/property/test_enrollment_properties.py`

**Property Tests:**
- [ ] Property 11: Enrollment verification compares client IDs
- [ ] Property 12: Enrollment failures return descriptive errors

---

## Phase 3: SSH Orchestration and Operations (19 hours)

### Task 3.1: Implement SSH Connection Management (4 hours)
- [ ] Implement SSH connection creation with asyncssh
- [ ] Load SSH keys from `/var/lib/linkops/keys/`
- [ ] Verify SSH key permissions are 600
- [ ] Handle proxy jump connections
- [ ] Implement connection timeout (30 seconds)
- [ ] Implement connection retry logic (3 attempts)
- [ ] Write unit tests with mocked SSH

**Files Created:**
- [ ] `backend/services/ssh_manager.py`
- [ ] `tests/unit/test_ssh_manager.py`

---

### Task 3.2: Implement SSH Orchestrator (6 hours)
- [ ] Implement SSHOrchestrator class
- [ ] Validate all targets are enrolled
- [ ] Create operation record with status "queued"
- [ ] Execute scripts with concurrency control
- [ ] Validate scripts are bash-only
- [ ] Capture stdout and stderr in real-time
- [ ] Record exit code and execution duration
- [ ] Update operation status on completion
- [ ] Store execution logs in operation_logs table
- [ ] Implement script execution timeout (300 seconds)
- [ ] Write unit tests for script execution
- [ ] Write property tests for Properties 13-18

**Files Created:**
- [ ] `backend/services/ssh_orchestrator.py`
- [ ] `tests/unit/test_ssh_orchestrator.py`
- [ ] `tests/property/test_ssh_orchestrator_properties.py`

**Property Tests:**
- [ ] Property 13: Operations require enrollment
- [ ] Property 14: Valid operations create queued records
- [ ] Property 15: Only bash scripts are executed
- [ ] Property 16: Script execution captures output and metadata
- [ ] Property 17: Operation status reflects execution results
- [ ] Property 18: Concurrency limits parallel executions

---

### Task 3.3: Implement Operations API Endpoints (4 hours)
- [ ] Create POST /api/operations/run endpoint
- [ ] Create GET /api/operations/{operation_id} endpoint
- [ ] Create POST /api/operations/{operation_id}/stop endpoint
- [ ] Validate operation requests
- [ ] Return operation ID on successful submission
- [ ] Return complete operation details including logs
- [ ] Implement operation cancellation
- [ ] Write integration tests

**Files Created:**
- [ ] `backend/api/operations.py`
- [ ] `tests/integration/test_operations_api.py`

---

### Task 3.4: Implement Server-Sent Events for Operations (5 hours)
- [ ] Create GET /api/operations/{operation_id}/events SSE endpoint
- [ ] Stream operation events (start, output, completion)
- [ ] Format events according to SSE specification
- [ ] Close stream when operation completes
- [ ] Handle client disconnection gracefully
- [ ] Support multiple concurrent SSE connections
- [ ] Write integration tests for SSE streaming
- [ ] Write property tests for Properties 19-20

**Files Created:**
- [ ] `backend/api/sse.py`
- [ ] `backend/services/sse_manager.py`
- [ ] `tests/integration/test_sse.py`
- [ ] `tests/property/test_sse_properties.py`

**Property Tests:**
- [ ] Property 19: SSE streams operation events
- [ ] Property 20: SSE connections close on completion

---

## Phase 4: Terminal Sessions and WebSocket (14 hours)

### Task 4.1: Implement Terminal Manager (5 hours)
- [ ] Implement TerminalManager class
- [ ] Generate unique workspace IDs
- [ ] Support layouts: single, grid2x2, grid1x3, grid2x1
- [ ] Implement pane assignment with enrollment validation
- [ ] Create SSH PTY sessions for panes
- [ ] Store workspace and pane data in database
- [ ] Implement workspace cleanup on closure
- [ ] Write unit tests for workspace management
- [ ] Write property tests for Properties 21-24

**Files Created:**
- [ ] `backend/services/terminal_manager.py`
- [ ] `tests/unit/test_terminal_manager.py`
- [ ] `tests/property/test_terminal_properties.py`

**Property Tests:**
- [ ] Property 21: Workspace IDs are unique
- [ ] Property 22: Pane assignments require enrollment
- [ ] Property 23: WebSocket routes I/O bidirectionally
- [ ] Property 24: Pane disconnection cleans up resources

---

### Task 4.2: Implement WebSocket Handler (6 hours)
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

**Files Created:**
- [ ] `backend/api/terminal.py`
- [ ] `backend/services/websocket_handler.py`
- [ ] `tests/integration/test_websocket.py`

---

### Task 4.3: Implement Terminal API Endpoints (3 hours)
- [ ] Create POST /api/terminal/workspaces endpoint
- [ ] Create PUT /api/terminal/workspaces/{id}/panes endpoint
- [ ] Create POST /api/terminal/workspaces/{id}/connect-all endpoint
- [ ] Validate workspace creation requests
- [ ] Validate pane assignments (targets enrolled)
- [ ] Return workspace details on creation
- [ ] Write integration tests

**Files Created:**
- [ ] `backend/api/terminal.py` (extend)
- [ ] `tests/integration/test_terminal_api.py`

---

## Phase 5: Table Queries and Health Monitoring (9 hours)

### Task 5.1: Implement Table Query Engine (5 hours)
- [ ] Implement TableQueryEngine class
- [ ] Validate table names against allowed list
- [ ] Implement column selection
- [ ] Implement filters with operators: eq, in, gt, lt, gte, lte
- [ ] Implement sorting by multiple columns
- [ ] Implement cursor-based pagination
- [ ] Create POST /api/tables/query endpoint
- [ ] Support all required tables
- [ ] Write unit tests for query processing
- [ ] Write property tests for Properties 25-27

**Files Created:**
- [ ] `backend/services/table_query_engine.py`
- [ ] `backend/api/tables.py`
- [ ] `tests/unit/test_table_query.py`
- [ ] `tests/property/test_table_query_properties.py`

**Property Tests:**
- [ ] Property 25: Table queries validate table names
- [ ] Property 26: Table queries apply filters, sorting, pagination
- [ ] Property 27: Table queries include metadata

---

### Task 5.2: Implement Health Monitoring (4 hours)
- [ ] Implement health check service
- [ ] Attempt SSH connection to each machine
- [ ] Measure connection latency
- [ ] Update machine status (online/offline)
- [ ] Store last_seen timestamp
- [ ] Run health checks every 5 minutes
- [ ] Handle health check failures gracefully
- [ ] Write unit tests for health checks
- [ ] Write property test for Property 28

**Files Created:**
- [ ] `backend/services/health_monitor.py`
- [ ] `tests/unit/test_health_monitor.py`
- [ ] `tests/property/test_health_properties.py`

**Property Tests:**
- [ ] Property 28: Health checks update machine status

---

## Phase 6: Configuration and Deployment (15 hours)

### Task 6.1: Implement Configuration Management (3 hours)
- [ ] Load configuration from `/etc/linkops/config.ini`
- [ ] Parse secrets.ini from Git repository
- [ ] Validate SSH key permissions (must be 600)
- [ ] Validate all required configuration values present
- [ ] Fail startup if configuration invalid
- [ ] Write unit tests for configuration loading
- [ ] Write property tests for Properties 29-30

**Files Created:**
- [ ] `backend/config.py` (extend)
- [ ] `backend/services/secrets_manager.py`
- [ ] `tests/unit/test_config.py`
- [ ] `tests/property/test_config_properties.py`

**Property Tests:**
- [ ] Property 29: SSH key permissions are validated
- [ ] Property 30: Secrets parsing extracts configuration

---

### Task 6.2: Implement Error Handling and Logging (4 hours)
- [ ] Implement structured error responses
- [ ] Log all errors with timestamp, context, stack trace
- [ ] Log SSH connection failures
- [ ] Log Git sync failures
- [ ] Log operation failures
- [ ] Implement log rotation (100MB max, 5 backups)
- [ ] Write unit tests for error handling
- [ ] Write property tests for Properties 35-36

**Files Created:**
- [ ] `backend/middleware/error_handler.py`
- [ ] `backend/logging_config.py` (extend)
- [ ] `tests/unit/test_error_handling.py`
- [ ] `tests/property/test_error_properties.py`

**Property Tests:**
- [ ] Property 35: Errors are logged with context
- [ ] Property 36: API errors return structured responses

---

### Task 6.3: Implement Operation History and Audit Trail (3 hours)
- [ ] Store completed operations in database
- [ ] Query operation history sorted by start time descending
- [ ] Include all execution logs and results
- [ ] Filter operations by status
- [ ] Filter operations by date range
- [ ] Write unit tests for history queries
- [ ] Write property tests for Properties 31-34

**Files Created:**
- [ ] `backend/services/audit_service.py`
- [ ] `tests/unit/test_audit.py`
- [ ] `tests/property/test_audit_properties.py`

**Property Tests:**
- [ ] Property 31: Completed operations are stored
- [ ] Property 32: Operation history is sorted by time
- [ ] Property 33: Operation views include complete data
- [ ] Property 34: Operation filtering returns matching subset

---

### Task 6.4: Create Systemd Service (2 hours)
- [ ] Create linkopsd.service file
- [ ] Configure service to run as linkops user
- [ ] Set working directory to /var/lib/linkops
- [ ] Configure automatic restart on failure
- [ ] Implement graceful shutdown on SIGTERM
- [ ] Log startup and shutdown events
- [ ] Test service start/stop/restart
- [ ] Write property test for Property 37

**Files Created:**
- [ ] `deployment/linkopsd.service` (✅ already created)
- [ ] `tests/property/test_service_properties.py`

**Property Tests:**
- [ ] Property 37: SIGTERM triggers graceful shutdown

---

### Task 6.5: Create Deployment Scripts (3 hours)
- [ ] Create installation script for Ubuntu 24.04
- [ ] Install Python 3.11+ and dependencies
- [ ] Create linkops user and group
- [ ] Create directory structure
- [ ] Set correct permissions
- [ ] Install systemd service
- [ ] Generate JWT secret
- [ ] Create initial config.ini
- [ ] Test installation on clean Ubuntu 24.04 LXC

**Files Created:**
- [ ] `deployment/install.sh` (✅ already created)
- [ ] `deployment/uninstall.sh` (✅ already created)
- [ ] `deployment/config.ini.template` (✅ already created)
- [ ] `deployment/README.md` (✅ already created)

---

## Phase 7: Testing and Documentation (18 hours)

### Task 7.1: Complete Property-Based Tests (6 hours)
- [ ] All 37 properties have corresponding Hypothesis tests
- [ ] Each test runs minimum 100 iterations
- [ ] All tests include proper docstrings
- [ ] All tests pass consistently
- [ ] Property test coverage: 100%

**All Property Tests (37 total):**
- [ ] Properties 1-3: Authentication
- [ ] Properties 4-6: Git Synchronization
- [ ] Properties 7-10: Inventory Management
- [ ] Properties 11-12: Enrollment Verification
- [ ] Properties 13-18: Script Execution
- [ ] Properties 19-20: Real-Time Monitoring
- [ ] Properties 21-24: Terminal Sessions
- [ ] Properties 25-27: Table Queries
- [ ] Property 28: Health Monitoring
- [ ] Properties 29-30: Configuration
- [ ] Properties 31-34: Operation History
- [ ] Properties 35-36: Error Handling
- [ ] Property 37: Service Management

---

### Task 7.2: Complete Integration Tests (5 hours)
- [ ] Test all REST endpoints with valid/invalid inputs
- [ ] Test authentication middleware on protected endpoints
- [ ] Test WebSocket connection lifecycle
- [ ] Test SSE event streaming
- [ ] Test error responses match expected format
- [ ] Integration test coverage: All API endpoints

**Files Created:**
- [ ] `tests/integration/test_api_endpoints.py` (extend)
- [ ] `tests/integration/test_websocket.py` (extend)
- [ ] `tests/integration/test_sse.py` (extend)

---

### Task 7.3: Create API Documentation (4 hours)
- [ ] Document all REST endpoints with examples
- [ ] Document WebSocket protocol and message format
- [ ] Document SSE event format
- [ ] Document authentication flow
- [ ] Document error codes and responses
- [ ] Generate OpenAPI/Swagger documentation
- [ ] Create Postman collection

**Files Created:**
- [ ] `docs/API.md`
- [ ] `docs/AUTHENTICATION.md`
- [ ] `docs/WEBSOCKET.md`
- [ ] `docs/postman_collection.json`

---

### Task 7.4: Create Deployment Documentation (3 hours)
- [ ] Document installation process
- [ ] Document configuration options
- [ ] Document Git repository setup
- [ ] Document SSH key management
- [ ] Document systemd service management
- [ ] Document troubleshooting common issues
- [ ] Document backup and recovery procedures

**Files Created:**
- [ ] `docs/DEPLOYMENT.md`
- [ ] `docs/CONFIGURATION.md`
- [ ] `docs/TROUBLESHOOTING.md`
- [ ] `docs/OPERATIONS.md`

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

## Final Validation

### Functionality
- [ ] All 65 acceptance criteria are met
- [ ] All API endpoints work correctly
- [ ] Frontend integrates successfully
- [ ] Git sync works with example repository
- [ ] SSH connections work to test machines
- [ ] Enrollment verification works
- [ ] Script execution works
- [ ] SSE streaming works
- [ ] WebSocket terminals work

### Testing
- [ ] All 37 property-based tests pass (100 iterations each)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Code coverage: 85%+ line, 80%+ branch

### Security
- [ ] JWT authentication works
- [ ] Account lockout works (5 attempts)
- [ ] Enrollment verification enforced
- [ ] SSH key permissions validated (600)
- [ ] Secrets not in Git

### Deployment
- [ ] Service installs successfully
- [ ] Service starts automatically
- [ ] Service restarts on failure
- [ ] Logs are written correctly
- [ ] Configuration loads correctly

### Documentation
- [ ] API documentation complete
- [ ] Deployment documentation complete
- [ ] All code is commented
- [ ] README files are accurate

---

## Progress Summary

**Total Tasks:** 28  
**Completed:** 0  
**In Progress:** 0  
**Remaining:** 28  

**Total Estimated Hours:** 98  
**Hours Completed:** 0  
**Hours Remaining:** 98  

**Completion Percentage:** 0%

---

**Last Updated:** January 28, 2026  
**Status:** Ready to Begin Implementation
