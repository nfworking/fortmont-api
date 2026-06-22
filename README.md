## Fortmont Web & Fortmont Webmail

### Requirements

- A database server, preferably mysql with a user able to access from remote connections
- A Microsoft Entra ID tenant if you wish to add entra ID authentication to the platform
- A Github O-Auth application for intergration with live github account stats
- A provisioned Mail server that uses tls (preferred) avaiable on the network
- A DNS server with HTTP REST capability for getting dns server records as well as the ability to create them
- A Reverse proxy server with a HTTP REST endpoint for retriving proxy server records
- A proxmox server as it the application primarly uses it for statistics and platform stats.



### Pre-Install steps

- Install Prisman globally using `bash 
 pnpm install prisma -g 
 `

- Install package modules with your package manager

- Run ```cp .example.env .env``` and use the example to fill in your own .env (for env variable usage, see [ENV](./docs/env.md))

- Run ` pnpm exec prisma generate && pnpm exec prisma migrate dev --name init`

#### Note; Only run prisma migrate if you dont have a exisitng database with the included schema

### Run the development server:

```bash
pnpm run dev

```



### API documentation can be found in the [API Docs](./docs/api_usage.md)


### Current Major features and future features
- Ticket dashboard
- KBA docs
- Admin homelab dashboard with different tabs
- Apps page to show homelab services
- Login page with device login notifications

### Features in progress
- Fully featured ticket dashboard (Current: Im Progress)
- Central account & profile center for both ticket and main app users (Current: Planning)
- Added database entry for users with api keys, jobs, workflows, access, roles, etc (Future: Initial Stage)

### AI usage Information:
This project was developed by a human developer with assistance from AI tools, primarily GitHub Copilot. The user interface was created using a combination of publicly available design templates, inspiration from the developer's own concepts, and components inspired by Shadcn UI.

AI assistance was used to help adapt and convert interface designs into React Native-compatible implementations. All application logic, architecture, and functionality were designed, reviewed, and validated by the developer. AI-generated code was subject to human review before inclusion in the project.

AI was primarily used as a development aid for tasks such as code suggestions, troubleshooting, and assistance with complex implementation challenges. Final decisions regarding design, functionality, and code quality remained under the developer's control throughout the project.

### Images and Video resources

This project contains images and videos that are free for use from pexels and unsplash. If you see your content, and would like for me to reference it, let me know!
