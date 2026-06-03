# Database Schema Documentation

This document describes the database models used by the application.

---

# LXC

The `lxc` table stores information about registered Linux Containers (LXCs) managed by the platform.

## Purpose

Used as an LXC registry to track deployed containers, their roles, status, and compose state.

## Fields

| Field                | Type     | Description                                                                       |
| -------------------- | -------- | --------------------------------------------------------------------------------- |
| `lxc_unique_id`      | UUID     | Unique identifier for the container.                                              |
| `lxc_ip`             | String   | IP address assigned to the container.                                             |
| `lxc_role`           | String   | Role or purpose of the container (e.g. Web Server, Database Server, Mail Server). |
| `lxc_status`         | String   | Current status of the container (Running, Stopped, Maintenance, etc.).            |
| `lxc_compose_status` | String   | Docker Compose deployment status for the container.                               |
| `created_at`         | DateTime | Date and time the container was registered.                                       |

### Example

```json
{
  "lxc_unique_id": "6f4c8b8e-3e8a-4c66-90fc-1c9c6d3d8c7f",
  "lxc_ip": "10.0.10.25",
  "lxc_role": "webserver",
  "lxc_status": "running",
  "lxc_compose_status": "healthy"
}
```

---

# Registry

The `registry` table stores information about API servers registered within the platform.

## Purpose

Used to track external or internal API endpoints that can be accessed by the application.

## Fields

| Field        | Type              | Description                              |
| ------------ | ----------------- | ---------------------------------------- |
| `id`         | UUID              | Unique identifier for the API server.    |
| `name`       | String            | Friendly name of the API server.         |
| `version`    | String            | Current version of the API service.      |
| `hosted_on`  | String            | Server or host where the API is running. |
| `server_url` | String (Optional) | Base URL used to access the API server.  |

### Example

```json
{
  "id": "3d9b98f7-4b1e-42c1-9f7e-3d73a0f8ef11",
  "name": "Fortmont API",
  "version": "1.0.0",
  "hosted_on": "prodapp01",
  "server_url": "https://api.example.com"
}
```

---

# AppUsers

The `AppUsers` table stores application user accounts.

## Purpose

Provides authentication, authorization, and profile information for users accessing the platform.

## Fields

| Field          | Type              | Description                                                                      |
| -------------- | ----------------- | -------------------------------------------------------------------------------- |
| `id`           | UUID              | Unique identifier for the user.                                                  |
| `username`     | String            | Unique username used for login.                                                  |
| `displayName`  | String (Optional) | Display name shown throughout the application.                                   |
| `email`        | String (Optional) | User email address.                                                              |
| `role`         | String (Optional) | User role used for permissions and access control.                               |
| `avatarUrl`    | String (Optional) | URL to the user's profile picture.                                               |
| `phone`        | String (Optional) | Contact phone number.                                                            |
| `isEntraUser`  | Boolean           | Indicates whether the account originates from Microsoft Entra ID authentication. |
| `passwordHash` | String            | Securely hashed password.                                                        |
| `isActive`     | Boolean           | Indicates whether the account is active.                                         |
| `createdAt`    | DateTime          | Account creation timestamp.                                                      |
| `updatedAt`    | DateTime          | Automatically updated when the record changes.                                   |

### Relationships

* One user can own multiple mailboxes.
* Linked to the `UserMailbox` table through `userId`.

---

# UserMailbox

The `UserMailbox` table stores mailbox accounts associated with application users.

## Purpose

Allows users to have one or more email accounts managed by the platform.

## Fields

| Field               | Type              | Description                                                  |
| ------------------- | ----------------- | ------------------------------------------------------------ |
| `id`                | UUID              | Unique mailbox identifier.                                   |
| `userId`            | UUID              | Reference to the owning user.                                |
| `email`             | String            | Mailbox email address.                                       |
| `encryptedPassword` | String            | Encrypted mailbox password.                                  |
| `isPrimary`         | Boolean           | Determines whether this is the user's primary mailbox.       |
| `provider`          | String (Optional) | Mail provider type (e.g. `mailcow`, `external`, `exchange`). |
| `createdAt`         | DateTime          | Mailbox creation timestamp.                                  |
| `updatedAt`         | DateTime          | Automatically updated when the record changes.               |

### Relationships

```text
AppUsers
    │
    ├── 1:N
    │
UserMailbox
```

A single application user may own multiple mailbox accounts.

### Constraints

* `userId + email` must be unique.
* Deleting a user automatically deletes all associated mailboxes (`Cascade Delete`).

### Example

```json
{
  "email": "user@example.com",
  "provider": "mailcow",
  "isPrimary": true
}
```

---

# Entity Relationships

```text
AppUsers
    │
    └───< UserMailbox

LXC
    │
    └── Independent Resource Registry

Registry
    │
    └── API Server Registry
```

---

# Summary

| Model         | Purpose                                                               |
| ------------- | --------------------------------------------------------------------- |
| `lxc`         | Stores registered Linux Containers and deployment status information. |
| `registry`    | Stores registered API servers and service endpoints.                  |
| `AppUsers`    | Stores application user accounts and authentication information.      |
| `UserMailbox` | Stores mailbox accounts associated with application users.            |
