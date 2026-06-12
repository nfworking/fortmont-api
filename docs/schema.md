# Database Schema Documentation

## Overview

This database supports a homelab management platform that provides:

* User authentication and account management
* Password reset functionality
* Mobile device notification registration
* Mailbox management
* Application registry and quick links
* LXC container tracking

---

# LXC Containers

Stores information about Linux Containers (LXC) running within the homelab environment.

## Table: `lxc`

| Field                | Type     | Description                                                               |
| -------------------- | -------- | ------------------------------------------------------------------------- |
| `lxc_unique_id`      | UUID     | Unique identifier for the container.                                      |
| `lxc_ip`             | String   | IP address assigned to the container.                                     |
| `lxc_role`           | String   | Purpose or role of the container (e.g. Web Server, Database, Monitoring). |
| `lxc_status`         | String   | Current container state (Running, Stopped, etc.).                         |
| `lxc_compose_status` | String   | Docker Compose deployment status within the container.                    |
| `created_at`         | DateTime | Timestamp when the record was created.                                    |

### Example

```text
ID: 4b3c0d4e...
IP: 192.168.1.20
Role: Jellyfin
Status: Running
Compose Status: Healthy
```

---

# Container Registry

Stores container image registry information.

## Table: `registry`

| Field        | Type              | Description                                |
| ------------ | ----------------- | ------------------------------------------ |
| `id`         | UUID              | Unique registry identifier.                |
| `name`       | String            | Registry name.                             |
| `version`    | String            | Registry version.                          |
| `hosted_on`  | String            | Host server where the registry is running. |
| `server_url` | String (Optional) | URL of the registry service.               |

### Example

```text
Name: Harbor
Version: 2.12.0
Hosted On: docker01
Server URL: https://registry.example.local
```

---

# Users

Stores application user accounts.

## Table: `AppUsers`

| Field          | Type              | Description                                              |
| -------------- | ----------------- | -------------------------------------------------------- |
| `id`           | UUID              | Unique user identifier.                                  |
| `username`     | String            | Unique login username.                                   |
| `displayName`  | String (Optional) | Friendly display name.                                   |
| `email`        | String (Optional) | User email address.                                      |
| `role`         | String (Optional) | User role (Admin, User, Technician, etc.).               |
| `avatarUrl`    | String (Optional) | Profile picture URL.                                     |
| `phone`        | String (Optional) | Contact number.                                          |
| `isEntraUser`  | Boolean           | Indicates if account originates from Microsoft Entra ID. |
| `passwordHash` | String            | Hashed user password.                                    |
| `isActive`     | Boolean           | Account enabled/disabled status.                         |
| `createdAt`    | DateTime          | Account creation timestamp.                              |
| `updatedAt`    | DateTime          | Last modification timestamp.                             |
| `onboarded`    | Boolean           | Indicates whether initial setup has been completed.      |

---

## Relationships

An AppUser may own:

* Multiple mailboxes
* Multiple device tokens
* Multiple password reset tokens

```text
AppUsers
 ├── UserMailbox
 ├── DeviceToken
 └── PasswordResetToken
```

---

# Password Reset Tokens

Stores password reset requests.

## Table: `PasswordResetToken`

| Field       | Type     | Description                     |
| ----------- | -------- | ------------------------------- |
| `id`        | CUID     | Unique token identifier.        |
| `userId`    | UUID     | User requesting password reset. |
| `token`     | String   | Unique reset token.             |
| `expiresAt` | DateTime | Token expiration time.          |

## Relationship

```text
PasswordResetToken
        │
        ▼
     AppUsers
```

### Notes

* Tokens are unique.
* Tokens expire automatically based on `expiresAt`.
* Deleting a user removes associated reset tokens.

---

# Mobile Device Tokens

Stores Firebase Cloud Messaging (FCM) device registrations.

## Table: `DeviceToken`

| Field             | Type              | Description                       |
| ----------------- | ----------------- | --------------------------------- |
| `id`              | UUID              | Unique device token identifier.   |
| `token`           | String            | Firebase device token.            |
| `platform`        | String            | Device platform (iOS or Android). |
| `deviceVersion`   | String (Optional) | Operating system version.         |
| `deviceName`      | String (Optional) | Device hostname/name.             |
| `deviceModelName` | String (Optional) | Device model.                     |
| `deviceBrand`     | String (Optional) | Device manufacturer.              |
| `userId`          | UUID              | Associated user.                  |
| `createdAt`       | DateTime          | Record creation timestamp.        |
| `updatedAt`       | DateTime          | Last update timestamp.            |

## Purpose

Used for:

* Push notifications
* Mobile alerts
* Service outage notifications
* Ticket updates

### Relationship

```text
AppUsers
    │
    └── DeviceToken
```

---

# User Mailboxes

Stores email accounts associated with users.

## Table: `UserMailbox`

| Field               | Type              | Description                 |
| ------------------- | ----------------- | --------------------------- |
| `id`                | UUID              | Unique mailbox identifier.  |
| `userId`            | UUID              | Associated user account.    |
| `email`             | String            | Mailbox email address.      |
| `encryptedPassword` | String            | Encrypted mailbox password. |
| `isPrimary`         | Boolean           | Indicates primary mailbox.  |
| `provider`          | String (Optional) | Mail provider source.       |
| `createdAt`         | DateTime          | Creation timestamp.         |
| `updatedAt`         | DateTime          | Last update timestamp.      |

### Supported Providers

Examples:

* Mailcow
* Microsoft 365
* Gmail
* External IMAP Server

### Relationship

```text
AppUsers
    │
    └── UserMailbox
```

### Constraints

```text
(userId, email) must be unique
```

This prevents duplicate mailbox assignments for the same user.

---

# Applications

Stores application shortcuts and service links.

## Table: `Apps`

| Field         | Type              | Description                       |
| ------------- | ----------------- | --------------------------------- |
| `id`          | UUID              | Unique application identifier.    |
| `label`       | String            | Application name shown in the UI. |
| `description` | String (Optional) | Description of the application.   |
| `url`         | String            | Application URL.                  |

### Example

```text
Label: Jellyfin
Description: Media Server
URL: https://jellyfin.example.local
```

### Use Cases

* Dashboard quick links
* Application launcher
* Homelab service catalogue
* Internal service directory

---

# Entity Relationship Diagram

```text
                    ┌─────────────────┐
                    │    AppUsers     │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼

┌────────────────┐  ┌────────────────┐  ┌────────────────────┐
│ UserMailbox    │  │ DeviceToken    │  │ PasswordResetToken │
└────────────────┘  └────────────────┘  └────────────────────┘


┌────────────────┐
│      Apps      │
└────────────────┘


┌────────────────┐
│      lxc       │
└────────────────┘


┌────────────────┐
│    registry    │
└────────────────┘
```

---

# Design Notes

This schema separates infrastructure, user management, and application management into distinct entities.

Key design principles:

* UUID-based identifiers throughout the system.
* Automatic timestamp tracking.
* Cascade deletion for dependent user records.
* Support for multiple mailboxes per user.
* Support for multiple mobile devices per user.
* Flexible application catalogue.
* Infrastructure inventory tracking for LXC containers and registries.

This structure provides a solid foundation for a homelab management portal, service dashboard, ticketing platform, and mobile notification system.
