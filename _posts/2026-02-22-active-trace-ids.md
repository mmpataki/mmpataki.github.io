---
tags: debugging saas cost-saving
category: programming
title: "Active trace ids"
date: 2026-02-22 14:45:00 +05:30
---

**TL;DR**
> Distributed applications use `trace-id`s (aka correlation ids / request ids) to trace requests accross application services to correlate logs, measure latencies. In this work, I extend these trace-ids to optionally enable some debugging functionality.


## What and why of `trace-ids`

Cloud applications usually push their logs to a centralized location. To make finding logs related to a particular action/request easier, clients mark every request with a globally unique id/trace-id (added to headers incase of HTTP requests before sending them to servers). Servers also do it to requests missing them and responses.

Sometimes they are also used to uniquely identify a change of state (history) in the applications.

This is the basic, universal usage of trace-ids. Now the same idea can be extended to solve a problem related to logging and debugging in production. Let's look at some problems.


## #P1. Cost involved with logging

Developers put log messages in applications mainly for -

  - To mark start and end of an action
  - To record time taken to complete an action
  - State of some system


Different levels like INFO, WARN, ERRO, DEBUG, TRACE are associated to a log message to convey the importance. Different logger implementations allows deployment & runtime control to toggle specific log messages.

If a log message is output from a hotspot (frequently executed code) it reduces the application performance as printing a log message involves 

  - Evaluation and serialization of the log message
  - Writing to an output stream
  - Sometimes even locking

Heavy logging also costs the organization in terms of money. So intotal, choosing a level for the log message and whether to log it is a tradeoff.


### Current solutions
There are some solutions available for these problems

#### 1. Set log level of a logger in runtime
This is a simplest solution which includes introduction of a logging agent in the application which can be signalled externally (a HTTP reqest) to change the level of a logger. Solr for eg. uses this. Problems of this method are

  - The change to the logger is global; in a multi-tenant environment it affects every tenant and every request taking this path.

  - If same logger is used by other API paths, they too get affected



## #P2. Cost involved with unoptimized debug builds

Compilers (eg. C/C++) usually have an option to generate optimized code which makes the binary a little hard to debug at runtime. The symbols are stripped off, the code is re-ordered, some dead code is eliminated etc.

These extremely well performing optimized builds but pose a problem while troubleshooting in production, you don't get proper stack traces, attach debuggers (well you don't get to do it in production anyway 🤣) etc. But you can't deploy debug builds as well just because you want debuggability.



## Solution

The idea of trace-ids can be extended to solve these problems in a simplest way. Idea is quite simple where we encode/append some flags to the trace ids which will enable these features. 

To puts things concretely, here is what we will do
  - While adding a trace id to a request, which looks like this

    ```
    9bf90701-b953-42fe-8d41-bd3760f94cfd
    ```

  - We will append a few extra flags to this id, which will look like

    ```
    9bf90701-b953-42fe-8d41-bd3760f94cfd-LD
    ```

### #S1 - DEBUG Logging
We need to add a Filter to our web-application (or any request processing chain) to look for these flags (in the above example flag `L`) and enable per thread debug logging.

Loggers like `log4j` support logging based on a MDC, the filter can use this to enable debug logging for this particular request.

By doing this all loggers in an application can be set to a level higher than DEBUG. When a user wants to troubleshoot an issue, he can enable the DEBUG logging (more on how to do this later).

We have seen a ~10x reduction in total logs produced by the application when we filter out DEBUG logs, so this saves a lot of compute and storage.


### #S2 - Routing the request to debug builds
Destination rules in service meshes like `istio` can be configured to forward the requests to particular destinations based on the flags (`D` in above example) in the headers. Once the requests with debug flag reach the process with debug binary the troubleshooting can be continued.


## Support from application side
To make this work, the application interfaces like UI should provide a debug mode / users need to install a plugin (browser plugin) which adds these flags to the requests.


## Demo
If you want a quick demo, go [here](/apps/active-trace-ids/). This demo completely runs in the browser simulating a client server interaction and showing server side logs.

A full implementation is available in [GitHub](https://github.com/mmpataki/active-trace-ids)


## Planned future work
1. A github repo with filters for popular web servers like Tomcat
2. Sample configuration for istio and other service meshes