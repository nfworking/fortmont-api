
# API Routes Reference Documentation Template

This document serves as a template and reference for the application's API endpoints. Each route listed below contains a structured outline for HTTP methods, request payloads, and expected behaviors. Customize the JSON payloads, descriptions, and methods as needed for your specific implementation.

---

## 🔐 Authentication Routes (`/api/auth/*`)

### 🔹 `/api/auth/entra-login`
- **HTTP POST Requirements**
  ```json
  {
    "token": "string",
    "tenant_id": "string",
    "user_principal_name": "user@domain.com"
  }

```

* **HTTP GET**
* *Description*: Retrieve current Entra ID session state or configuration.



---

### 🔹 `/api/auth/login`

* **HTTP POST Requirements**
```json
{
  "username": "admin",
  "password": "secure_password_here"
}

```


* **HTTP GET**
* *Description*: Check login endpoint availability or status.



---

### 🔹 `/api/auth`

* **HTTP GET**
* *Description*: Fetch current session context or authentication configuration metadata.



---

### 🔹 `/api/auth/[...nextauth]`

* **NextAuth.js Catch-All Route**
* *Description*: Handles all incoming NextAuth.js authentication requests (e.g., signin, signout, callback, session).
* *Methods Supported*: `GET`, `POST`



---

## 🌐 Network & Infrastructure Routes

### 🔹 `/api/dns`

* **HTTP POST Requirements**
```json
{
  "zone": "example.com",
  "record_type": "A",
  "name": "subdomain",
  "value": "10.0.0.5",
  "ttl": 3600
}

```


* **HTTP GET**
* *Description*: List or query DNS records.



---

### 🔹 `/api/proxy`

* **HTTP POST Requirements**
```json
{
  "source_domain": "app.example.com",
  "target_url": "[http://10.0.0.1:8080](http://10.0.0.1:8080)",
  "ssl_enabled": true
}

```


* **HTTP GET**
* *Description*: Fetch active reverse proxy routing rules.



---

## 📬 Mailbox Management Routes

### 🔹 `/api/mailbox/create`

* **HTTP POST Requirements**
```json
{
  "mailbox_name": "info",
  "domain": "example.com",
  "quota_mb": 5120,
  "access_users": ["admin@example.com"]
}

```



---

### 🔹 `/api/mailbox`

* **HTTP GET**
* *Description*: Retrieve a list of all managed mailboxes or filter by specific query parameters.


* **HTTP DELETE Requirements**
```json
{
  "mailbox_id": "mb_01J2X4"
}

```



---

## 🖥️ Proxmox Virtualization Routes

### 🔹 `/api/proxmox/hosts`

* **HTTP GET**
* *Description*: List clustered Proxmox hypervisor nodes and their hardware resource summaries.



---

### 🔹 `/api/proxmox/lxc`

* **HTTP POST Requirements for creating/registering LXCs**
```json
{
  "lxc_ip": "10.0.0.1",
  "lxc_role": "mysql",
  "lxc_status": "disabled",
  "lxc_compose_status": "pending"
}

```


* **HTTP GET**
* *Description*: List all LXC containers or query specific cluster details.



---

### 🔹 `/api/proxmox/resources`

* **HTTP GET**
* *Description*: Retrieve cluster-wide resource metrics including CPU, RAM, and Storage allocations.



---

## ⚙️ Core System & User Routes

### 🔹 `/api/realtime`

* **HTTP GET / WebSocket Upgrade**
* *Description*: Endpoint for initiating real-time pub/sub sessions or event streams.



---

### 🔹 `/api/registry`

* **HTTP POST Requirements**
```json
{
  "image_name": "custom-service",
  "tag": "latest",
  "registry_url": "registry.local"
}

```


* **HTTP GET**
* *Description*: List registered system images, modules, or services.



---

### 🔹 `/api/users`

* **HTTP POST Requirements**
```json
{
  "email": "newuser@example.com",
  "role": "editor",
  "status": "active"
}

```


* **HTTP GET**
* *Description*: Query the system users list with pagination and filtering.



```

```