# Features that are implemented
 ### Login System ( Pre Release Quality )
  - A modern login page designed for the login system, it also includes a seperate login page for the mail client. It handles both entra and credentials login. It has EntraID with profile sync to the database, it also has credentials login with standard username and password login with a password reset flow included

 ### Dashboard (In Progress)
   -  Dashboard Pages feature a application shell, with the main page on the dashboard being a proxmox cluster summary, with vm, storage, node and lxc information.
   - Server Settings page does not currently have any content in it 
   - Site Users contains information about the current site users, including their id, type, role, and other personal information
   - Server registry info and lxc registry info is depreciated and will be removed in future releases
   - Dns records page retrives information from the dns server, displays records, types and address it resolves to
   - Proxy page lists all the proxy hosts and routes on the configured proxy server, including, entrypoints, id, rules and targets. 
   - SSL Certs page includes information about the ssl certificates made my the proxy server and cloudflare, it includes domain, resolver, expiry.
   - Azure Page contains information about the EntraID and Azure subscription for the application. It includes information about EntraID users, groups, devices, apps, and logs. It also includes a Azure section, which includes information about subscriptions, resources, vms, storage and role assignments. 



 ### Mail Client (In Progress)
 - A mail client which connects user information from the db and automatically sign-ins in the user. Features inbox and sent page at the moment, with a search function aswell.

 ### Apps Page (Quick access Page)
 - A quick access page featuring all the pages in the application and their links, as well as links to homelab services, with a moving background
 
 




 # Future Features 

 ### Ticket Management System 
 - A ServiceNow ticket style system that is more fintuned towards homelab tasks, will feature activity logs, comments, live chat*, chatbot*, seprate pages and dashboard under /ticketing. It will use the exisitng authentication system for auth, and the exisitng DB. It will also feature RBAC** for users and IT Admins. It will also feature a KBA style homepage, with the ability to search and use docs, for different tasks, create INC, UR, and REQ tickets, with some REQ being automated by the system***



 - (* ) these features will be subjected to avaiability and difficulty, not all features of live chat and ai chatbot will be possible, so it may not be implemented
 - (**) This will be implemented for both entraid users and local users, AD intergration will also possibly be implements
 - (***) This feature may or may not be implements, pending difficutly and usefulness review.