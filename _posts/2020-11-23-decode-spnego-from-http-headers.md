---
title: Decoding SPNEGO from HTTP headers
tags: hack spnego kerberos http wireshark
category: Programming
---

Today I was debugging some `SPNEGO` auth issue and didn't have the tcpdump capture... How do I proceed? I noticed that I had the HTTP headers logged by the client (`curl`).

```
> GET /webhdfs/v1/?op=LISTSTATUS HTTP/1.1
> Authorization: Negotiate YIICmgYJKoZIhvcSAQICAQBuggKJMIIChaADAgEFoQMCAQ6iBwMFACAAAACjggF2YYIBcjCCAW6gAwIBBaENGwtNUEFUQUtJLkNPTaIrMCmgAwIBA6EiMCAbBEhUVFAbGG1wY2RoMDAxLmluZm9ybWF0aWNhLmNvbaOCASkwggEloAMCARKhAwIBBaKCARcEggETiOXup3gIHBIPifCIPLWSw5GBuP4UePjwuSojPWZd5UBa46K/8d7iwEgaifg7RjEkVnfPmk7bT/g6tz6xRCHw0oprgRa2vXmRfsYmoIZLyvMagbPkj6KNBSsS+3+7oHBSie7+k5R06xcW5+hPLV9/xyoI0rDxALfDSgUmj0TKon40bPRD+a7IgUGSoOH0ezNKt46KfGRSbNmoxoK3FbBUjAAgAHeDR1taGNMadOIIXIsuICpoCur/QNXsIrUuVAwzE56z4G2bpY8+38Ogn7u9de9Cen6Pv2we/frDx+nGP7k/KDsFCg5GU5+MrF4iTSS6+DB6Ec6cyH9MkBN8oos16tA5rBh3WDhVqXHADWZ1nEeDhnGkgfUwgfKgAwIBEqKB6gSB59/2MgpRkHGGuZqhc8cg4wAVeHWNl+C3Wby41KBkgDms/8wkKZzFq8PYTUm+jBZ4prNUxE7TZb8gZTwDYNNKfSv9ZNhJ43uHzhl+qXwIqYZ0jIA33/TMhX2PQKl3GrYAh3uSE1laqMb1Oo2cFrEI5cwKT8EyLdOlRyMNv6+phybuc81ERVMm2rqTl0yIk5RU9/nCz3XUF8bfgIl53Yn+3JXCs9upmTbFwkwAACnCPX3oPUcWocLEgjIMZpCAJojQLMmcsLhXQZnKhanP9CWQ3KrJ4xv9QJoeG/+1h9J33/sM2crSQleRKA==
> User-Agent: curl/7.29.0
> Host: mpcdh001.informatica.com:50070
> Accept: */*
```

But how do I parse the header `Authorization`? Looks like a base64 encoding, but if it's binary, encoded into that format... Can wireshark decode that? Googling didn't help..

I came up with a hack: I will try to build a tcpdump capture with same headers in the HTTP req and provide that new capture to the wireshark. Yeah... you guessed the steps right

1. Create a HTTP request (two new lines at the end)
    ```bash
    $ cat req
    GET /webhdfs/v1/?op=LISTSTATUS HTTP/1.1
    Authorization: Negotiate YIICmgYJKoZIhvcSAQICAQBuggKJMIIChaADAgEFoQMCAQ6iBwMFACAAAACjggF2YYIBcjCCAW6gAwIBBaENGwtNUEFUQUtJLkNPTaIrMCmgAwIBA6EiMCAbBEhUVFAbGG1wY2RoMDAxLmluZm9ybWF0aWNhLmNvbaOCASkwggEloAMCARKhAwIBBaKCARcEggETiOXup3gIHBIPifCIPLWSw5GBuP4UePjwuSojPWZd5UBa46K/8d7iwEgaifg7RjEkVnfPmk7bT/g6tz6xRCHw0oprgRa2vXmRfsYmoIZLyvMagbPkj6KNBSsS+3+7oHBSie7+k5R06xcW5+hPLV9/xyoI0rDxALfDSgUmj0TKon40bPRD+a7IgUGSoOH0ezNKt46KfGRSbNmoxoK3FbBUjAAgAHeDR1taGNMadOIIXIsuICpoCur/QNXsIrUuVAwzE56z4G2bpY8+38Ogn7u9de9Cen6Pv2we/frDx+nGP7k/KDsFCg5GU5+MrF4iTSS6+DB6Ec6cyH9MkBN8oos16tA5rBh3WDhVqXHADWZ1nEeDhnGkgfUwgfKgAwIBEqKB6gSB59/2MgpRkHGGuZqhc8cg4wAVeHWNl+C3Wby41KBkgDms/8wkKZzFq8PYTUm+jBZ4prNUxE7TZb8gZTwDYNNKfSv9ZNhJ43uHzhl+qXwIqYZ0jIA33/TMhX2PQKl3GrYAh3uSE1laqMb1Oo2cFrEI5cwKT8EyLdOlRyMNv6+phybuc81ERVMm2rqTl0yIk5RU9/nCz3XUF8bfgIl53Yn+3JXCs9upmTbFwkwAACnCPX3oPUcWocLEgjIMZpCAJojQLMmcsLhXQZnKhanP9CWQ3KrJ4xv9QJoeG/+1h9J33/sM2crSQleRKA==
    User-Agent: curl/7.29.0
    Host: mpcdh001.informatica.com:50070
    Accept: */*


    ```

2. Start a dummy server
    ```bash
    $ nc -l 7890 &
    ```

3. Start tcpdump
    ```bash
    $ tcpdump -w cap.pcap -s 0 -i lo tcp port 7890
    ```

4. Throw a request at it
    ```bash
    $ cat req | nc localhost 7890
    ```

5. Stop the tcpdump
    ```bash
    $ fg
    <ctrl+c>
    ```

6. Open this file in wireshark
    ```bash
    $ ls -1
    cap.pcap
    ...

## Capture
![wireshark capture 23 nov](/images/blog/decode_spnego/spnego_capture_23_nov.png)