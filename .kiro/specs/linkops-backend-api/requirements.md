# Requirements Document

## Introduction

LinkOps is a secure SSH orchestration and bash script execution platform for SnS Network Solutions. The backend API provides authentication, inventory management via Git sync, SSH orchestration for script execution, real-time operation monitoring, and interactive terminal sessions. The system enforces enrollment-based security where target machines must have a client ID file matching the inventory before any operations can be executed.

## Glossary

- **LinkOps_API**: The FastAPI-based backend service that provides REST and WebSocket endpoints
- **Git_Sync_Engine**: Component that clones and parses the private Git repository containing inventory and scripts
- **SSH_Orchestrator**: Component that executes bash scripts on enrolled machines via SSH
- **Enrollment_Verifier**: Component that validates machines have the required client ID file
- **Operation**: A script execution task targeting one or more machines
- **Link**: A machine (VPS, Proxmox host, or VM) in the infrastructure inventory
- **Terminal_Workspace**: A multi-pane terminal session with WebSocket connections
- **Client_ID**: UUID-based enrollment identifier stored in `/etc/linkops/client_id` on target machines
- **Table_Query_Engine**: Component that processes unified table queries across all data tables

## Requirements

### Requirement 1: Authentication and Authorization

**User Story:** As an administrator, I want to authenticate with username and password, so that I can securely access the LinkOps API.

#### Acceptance Criteria

1. WHEN an administrator submits valid credentials to the login endpoint, THE LinkOps_API SHALL return a JWT token with 24-hour expiration
2. WHEN an administrator submits invalid credentials, THE LinkOps_API SHALL return an error and increment the failed attempt counter
3. WHEN an administrator fails authentication 5 times within 5 minutes, THE LinkOps_API SHALL lock the account for 5 minutes
4. WHEN a JWT token is included in API requests, THE LinkOps_API SHALL validate the token signature and expiration
5. WHEN a JWT token is expired or invalid, THE LinkOps_API SHALL return a 401 Unauthorized response

### Requirement 2: Git Repository Synchronization

**User Story:** As a system administrator, I want the API to sync inventory and scripts from a private Git repository, so that configuration is version-controlled and centralized.

#### Acceptance Criteria

1. WHEN the Git sync endpoint is called, THE Git_Sync_Engine SHALL clone or pull the configured private repository
2. WHEN the repository is successfully synced, THE Git_Sync_Engine SHALL parse links.yaml and update the database
3. WHEN the repository is successfully synced, THE Git_Sync_Engine SHALL parse scripts.yaml and update the database
4. WHEN parsing links.yaml, THE Git_Sync_Engine SHALL validate that each link has required fields (type, host, port, user, enrollment.clientId)
5. WHEN parsing scripts.yaml, THE Git_Sync_Engine SHALL validate that each script has required fields (name, description, path)
6. WHEN Git authentication fails, THE Git_Sync_Engine SHALL return an error with details
7. WHEN YAML parsing fails, THE Git_Sync_Engine SHALL return an error identifying the invalid file

### Requirement 3: Machine Inventory Management

**User Story:** As an operator, I want to query and view machine inventory, so that I can see all available links and their status.

#### Acceptance Criteria

1. WHEN the links endpoint is called, THE LinkOps_API SHALL return all machines from the database
2. WHEN a specific link ID is requested, THE LinkOps_API SHALL return that machine's details
3. WHEN querying links, THE LinkOps_API SHALL include enrollment status, SSH configuration, and health metrics
4. WHEN filtering links by type, THE LinkOps_API SHALL return only machines matching the specified type
5. WHEN sorting links, THE LinkOps_API SHALL order results by the specified column and direction

### Requirement 4: Enrollment Verification

**User Story:** As a security administrator, I want machines to be verified for enrollment before operations, so that only authorized machines can execute scripts.

#### Acceptance Criteria

1. WHEN verifying enrollment, THE Enrollment_Verifier SHALL connect to the target machine via SSH
2. WHEN connected, THE Enrollment_Verifier SHALL read the file `/etc/linkops/client_id`
3. WHEN the client ID file exists, THE Enrollment_Verifier SHALL compare its contents to the inventory enrollment ID
4. WHEN the client IDs match, THE Enrollment_Verifier SHALL mark the machine as enrolled
5. WHEN the client ID file is missing or mismatched, THE Enrollment_Verifier SHALL mark the machine as not enrolled
6. WHEN enrollment verification fails, THE Enrollment_Verifier SHALL return an error with details

### Requirement 5: SSH Script Execution

**User Story:** As an operator, I want to execute bash scripts on multiple machines concurrently, so that I can perform operations at scale.

#### Acceptance Criteria

1. WHEN an operation is submitted, THE SSH_Orchestrator SHALL validate that all target machines are enrolled
2. WHEN targets are enrolled, THE SSH_Orchestrator SHALL create an operation record with status "queued"
3. WHEN executing scripts, THE SSH_Orchestrator SHALL connect to each target using the configured SSH key
4. WHEN connected, THE SSH_Orchestrator SHALL execute only bash scripts (no other interpreters)
5. WHEN a script executes, THE SSH_Orchestrator SHALL capture stdout and stderr in real-time
6. WHEN a script completes, THE SSH_Orchestrator SHALL record the exit code and execution duration
7. WHEN all targets complete, THE SSH_Orchestrator SHALL update the operation status to "success", "failed", or "partial"
8. WHEN concurrency is specified, THE SSH_Orchestrator SHALL limit parallel executions to the specified number

### Requirement 6: Real-Time Operation Monitoring

**User Story:** As an operator, I want to see live output from running operations, so that I can monitor progress in real-time.

#### Acceptance Criteria

1. WHEN an operation is running, THE LinkOps_API SHALL provide a Server-Sent Events (SSE) endpoint
2. WHEN a client connects to the SSE endpoint, THE LinkOps_API SHALL stream operation events
3. WHEN a script produces output, THE LinkOps_API SHALL send an SSE event with the output data
4. WHEN a script completes, THE LinkOps_API SHALL send an SSE event with the final status
5. WHEN the operation finishes, THE LinkOps_API SHALL close the SSE connection

### Requirement 7: Interactive Terminal Sessions

**User Story:** As an operator, I want to open interactive SSH sessions in multiple panes, so that I can work on several machines simultaneously.

#### Acceptance Criteria

1. WHEN creating a terminal workspace, THE LinkOps_API SHALL generate a unique workspace ID
2. WHEN assigning panes, THE LinkOps_API SHALL validate that target machines are enrolled
3. WHEN connecting a pane, THE LinkOps_API SHALL establish an SSH PTY session to the target
4. WHEN a WebSocket client connects, THE LinkOps_API SHALL route stdin/stdout between client and SSH session
5. WHEN the client sends input, THE LinkOps_API SHALL forward it to the appropriate SSH session
6. WHEN the SSH session produces output, THE LinkOps_API SHALL send it to the WebSocket client
7. WHEN a pane is disconnected, THE LinkOps_API SHALL close the SSH session and clean up resources

### Requirement 8: Table-Based Query Interface

**User Story:** As a frontend developer, I want a unified table query endpoint, so that I can fetch data using a consistent Excel-like interface.

#### Acceptance Criteria

1. WHEN a table query is submitted, THE Table_Query_Engine SHALL validate the table name exists
2. WHEN columns are specified, THE Table_Query_Engine SHALL return only those columns
3. WHEN filters are specified, THE Table_Query_Engine SHALL apply them using the specified operators (eq, in, gt, lt)
4. WHEN sorting is specified, THE Table_Query_Engine SHALL order results by the specified columns and directions
5. WHEN pagination is specified, THE Table_Query_Engine SHALL return the requested page size and next cursor
6. WHEN the query completes, THE Table_Query_Engine SHALL return results with metadata including timestamp

### Requirement 9: Health Monitoring and Status

**User Story:** As an operator, I want to see machine health status, so that I can identify connectivity issues.

#### Acceptance Criteria

1. WHEN checking machine health, THE LinkOps_API SHALL attempt an SSH connection to the target
2. WHEN the connection succeeds, THE LinkOps_API SHALL measure the connection latency
3. WHEN the connection succeeds, THE LinkOps_API SHALL update the machine status to "online"
4. WHEN the connection fails, THE LinkOps_API SHALL update the machine status to "offline"
5. WHEN health checks complete, THE LinkOps_API SHALL store the timestamp of the last successful check

### Requirement 10: Configuration and Secrets Management

**User Story:** As a system administrator, I want secrets stored securely outside the Git repository, so that sensitive data is not version-controlled.

#### Acceptance Criteria

1. WHEN the API starts, THE LinkOps_API SHALL read configuration from `/etc/linkops/config.ini`
2. WHEN loading SSH keys, THE LinkOps_API SHALL read them from `/var/lib/linkops/keys/`
3. WHEN accessing SSH keys, THE LinkOps_API SHALL verify file permissions are 600
4. WHEN secrets.ini is synced from Git, THE LinkOps_API SHALL parse it for key paths and tokens
5. WHEN secrets are missing or invalid, THE LinkOps_API SHALL log an error and fail to start

### Requirement 11: Operation History and Audit Trail

**User Story:** As an administrator, I want to view operation history, so that I can audit what scripts were executed and when.

#### Acceptance Criteria

1. WHEN operations complete, THE LinkOps_API SHALL store the full operation record in the database
2. WHEN querying operation history, THE LinkOps_API SHALL return operations sorted by start time descending
3. WHEN viewing an operation, THE LinkOps_API SHALL include all execution logs and results
4. WHEN filtering operations by status, THE LinkOps_API SHALL return only operations matching the specified status
5. WHEN filtering operations by date range, THE LinkOps_API SHALL return only operations within the specified range

### Requirement 12: Error Handling and Logging

**User Story:** As a system administrator, I want comprehensive error logging, so that I can troubleshoot issues effectively.

#### Acceptance Criteria

1. WHEN an error occurs, THE LinkOps_API SHALL log the error with timestamp, context, and stack trace
2. WHEN SSH connections fail, THE LinkOps_API SHALL log the target, error type, and details
3. WHEN Git sync fails, THE LinkOps_API SHALL log the repository URL and error message
4. WHEN operations fail, THE LinkOps_API SHALL log the operation ID, target, and failure reason
5. WHEN API requests fail, THE LinkOps_API SHALL return structured error responses with error codes

### Requirement 13: Systemd Service Integration

**User Story:** As a system administrator, I want the API to run as a systemd service, so that it starts automatically and can be managed with standard tools.

#### Acceptance Criteria

1. WHEN the systemd service starts, THE LinkOps_API SHALL bind to the configured host and port
2. WHEN the service receives SIGTERM, THE LinkOps_API SHALL gracefully shutdown active connections
3. WHEN the service crashes, THE systemd SHALL restart it automatically
4. WHEN the service starts, THE LinkOps_API SHALL log the startup event with version information
5. WHEN the service stops, THE LinkOps_API SHALL log the shutdown event
