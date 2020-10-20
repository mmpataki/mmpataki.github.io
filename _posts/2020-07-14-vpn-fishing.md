---
tags: vpn phishing hack
category: Programming
---

Recently I encountered an interesting scenario where a link I clicked on a link in an email local to our VPN opened a public website. Link was similar to  
```  
swarm/changes/674362
```

Now, I was expecting some diff of files described in the mail but I found completely different stuff and I checked whether I am connected to the VPN or not. As you might expect, I was not. Some time later I thought we can use this to trick people to get their credentials for swarm. If you got the credentials, and if they are same as the NT credentials, (... think of the bad things you can do on your own)  
  

#### A simpler explanation with Alice and Bob

1. Alice (A bad girl) has set up a public website with DNS name `xyz` which mimicks a site in VPN which both Alice and Bob can access (It's not mandatory that, Alice should have access to it)  
  
2. Alice sends an email to Bob which contains a protected url as below  
```  
xyz/foo/bar  
```
  
3. Here it is assumed that, xyz is a site available in VPN as well as on the internet.  
  
4. If Bob is connected to VPN and opens the URL, he will hit the local (present in the VPN) site and things will go well  
  
5. If Bob is not connected to VPN he will connect to the public website (URL in the address bar will still be same) and he will enters his credentials to access /foo/bar and will be compromised.  
  

#### How can one protect themselves?
- Orgs can WARN their employees when they visit public sites (or block these sites) whose DNS names match the local site DNS names.

