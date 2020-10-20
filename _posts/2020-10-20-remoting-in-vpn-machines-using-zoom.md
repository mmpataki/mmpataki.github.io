---
category: Programming
tags: remote zoom hack
title: Remote control machines in VPN
---

Do you experience slowness when using the RDP over VPN? Or can't you connect (don't want to connect) to VPN but access services in the VPN? We can use internet based remoting applications to do this. Few examples are Zoom, Skype.

## Zoom
1. RDP in to the target computer (which you want to control) install Zoom and join your personal meeting room. (This can be automated if CLI is available)

2. Share the complete screen

3. On your laptop, join your personal meeting room

4. On target computer, tick the `auto accept all requests` under the `Remote controlled` section (__This needs to be done only once__ zoom bug :D )

5. On your laptop, ask for control and it will be auto accepted.

6. You can close the RDP

The idea above seems foolproof, but won't work because as soon you close the RDP session the Zoom exits.

## Solution
1. Use two target machines

2. Use one of them to keep the RDP session active

3. Other to share the screen
