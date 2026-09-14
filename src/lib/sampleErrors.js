export const SAMPLE_ERRORS = [
  {
    id: 'node-module-missing',
    label: 'Node: MODULE_NOT_FOUND',
    description: 'Missing dependency in Node.js / npm',
    log: `node:internal/modules/cjs/loader:1147
  throw err;
  ^

Error: Cannot find module 'express'
Require stack:
- /app/server.js
- /app/index.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1144:15)
    at Module._load (node:internal/modules/cjs/loader:985:27)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:135:12) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [ '/app/server.js', '/app/index.js' ]
}`,
  },
  {
    id: 'docker-bind-failed',
    label: 'Docker: Port Conflict',
    description: 'Port already allocated in Docker container',
    log: `docker: Error response from daemon: driver failed programming external connectivity on endpoint web-service (a1b2c3d4e5f6): Bind for 0.0.0.0:8080 failed: port is already allocated.
ERRO[0001] error waiting for container: context canceled`,
  },
  {
    id: 'python-key-error',
    label: 'Python: KeyError in Dict',
    description: 'Accessing non-existent key in Python dictionary',
    log: `Traceback (most recent call last):
  File "/workspace/app/services/pipeline.py", line 42, in process_payload
    user_token = auth_data["session"]["token_id"]
KeyError: 'token_id'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/workspace/main.py", line 18, in <module>
    run_pipeline(request.json())
  File "/workspace/app/services/pipeline.py", line 87, in run_pipeline
    return process_payload(payload)
RuntimeError: Critical failure processing payload`,
  },
  {
    id: 'git-merge-conflict',
    label: 'Git: Merge Conflict',
    description: 'Conflicting updates during rebase or pull',
    log: `Auto-merging src/components/Header.jsx
CONFLICT (content): Merge conflict in src/components/Header.jsx
Automatic merge failed; fix conflicts and then commit the result.
error: could not apply 7a2b9c1... update navigation items
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".`,
  },
  {
    id: 'rust-borrow-checker',
    label: 'Rust: Borrow Checker',
    description: 'Cannot borrow as mutable more than once',
    log: `error[E0499]: cannot borrow \`data\` as mutable more than once at a time
  --> src/main.rs:14:5
   |
12 |     let first = data.get_mut(0);
   |                 ---- first mutable borrow occurs here
13 |     let second = data.get_mut(1);
   |                  ^^^^ second mutable borrow occurs here
14 |     println!("{:?}, {:?}", first, second);
   |                            ----- first borrow later used here
For more information about this error, try \`rustc --explain E0499\`.`,
  },
  {
    id: 'k8s-oom-killed',
    label: 'K8s: OOMKilled (Exit 137)',
    description: 'Kubernetes Pod CrashLoopBackOff & OOMKilled exit code 137',
    log: `State:          Waiting
      Reason:       CrashLoopBackOff
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
      Started:      Mon, 14 Sep 2026 14:22:01 +0000
      Finished:     Mon, 14 Sep 2026 14:23:44 +0000
    Ready:          False
    Restart Count:  5
    Limits:
      cpu:     500m
      memory:  256Mi
    Requests:
      cpu:     100m
      memory:  128Mi
Events:
  Type     Reason     Age                   From               Message
  ----     ------     ----                  ----               -------
  Normal   Pulled     2m (x5 over 6m)       kubelet            Container image "registry.k8s.io/worker:v1.4.2" already present on machine
  Normal   Created    2m (x5 over 6m)       kubelet            Created container worker-job
  Normal   Started    2m (x5 over 6m)       kubelet            Started container worker-job
  Warning  BackOff    14s (x18 over 5m)     kubelet            Back-off restarting failed container worker-job in pod worker-service-7f89d5c4b-q9x2m_default`,
  },
  {
    id: 'go-nil-pointer',
    label: 'Go: Nil Pointer Panic',
    description: 'panic: runtime error: invalid memory address or nil pointer dereference',
    log: `panic: runtime error: invalid memory address or nil pointer dereference
[signal SIGSEGV: segmentation violation code=0x1 addr=0x0 pc=0x10a24f0]

goroutine 19 [running]:
main.(*UserCache).Get(0x0, 0xc00010c000, 0x10)
	/workspace/src/cache/user_cache.go:42 +0x30
main.handleAuth(0xc0000bc0a0)
	/workspace/src/handlers/auth.go:78 +0x145
net/http.HandlerFunc.ServeHTTP(0x1121d58, 0xc0000e2000, 0xc0000bc0a0)
	/usr/local/go/src/net/http/server.go:2084 +0x44
net/http.serverHandler.ServeHTTP(0xc0000ae000, 0xc0000e2000, 0xc0000bc0a0)
	/usr/local/go/src/net/http/server.go:2925 +0x316
net/http.(*conn).serve(0xc000088000, 0x11234a8, 0xc000078040)
	/usr/local/go/src/net/http/server.go:1964 +0x5cd
created by net/http.(*Server).Serve in goroutine 1
	/usr/local/go/src/net/http/server.go:3071 +0x4cd`,
  },
  {
    id: 'spring-unsatisfied-dependency',
    label: 'Spring: UnsatisfiedDependency',
    description: 'org.springframework.beans.factory.UnsatisfiedDependencyException / NoSuchBeanDefinitionException',
    log: `2026-09-14T14:30:12.441+00:00 ERROR 14208 --- [main] o.s.boot.SpringApplication               : Application run failed

org.springframework.beans.factory.UnsatisfiedDependencyException: Error creating bean with name 'orderService' defined in file [/app/classes/com/example/store/service/OrderService.class]: Unsatisfied dependency expressed through constructor parameter 0: No qualifying bean of type 'com.example.store.repository.PaymentRepository' available: expected at least 1 bean which qualifies as autowire candidate. Dependency keys:
- 'orderService' -> 'paymentRepository'
	at org.springframework.beans.factory.support.ConstructorResolver.createArgumentArray(ConstructorResolver.java:797) ~[spring-beans-6.1.4.jar:6.1.4]
	at org.springframework.beans.factory.support.ConstructorResolver.autowireConstructor(ConstructorResolver.java:237) ~[spring-beans-6.1.4.jar:6.1.4]
	at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.autowireConstructor(AbstractAutowireCapableBeanFactory.java:1356) ~[spring-beans-6.1.4.jar:6.1.4]
Caused by: org.springframework.beans.factory.NoSuchBeanDefinitionException: No qualifying bean of type 'com.example.store.repository.PaymentRepository' available: expected at least 1 bean which qualifies as autowire candidate.
	at org.springframework.beans.factory.support.DefaultListableBeanFactory.raiseNoMatchingBeanFound(DefaultListableBeanFactory.java:1880) ~[spring-beans-6.1.4.jar:6.1.4]
	at org.springframework.beans.factory.support.DefaultListableBeanFactory.doResolveDependency(DefaultListableBeanFactory.java:1344) ~[spring-beans-6.1.4.jar:6.1.4]`,
  },
  {
    id: 'cpp-segfault-gdb',
    label: 'C++ / GDB: Segmentation Fault',
    description: 'SIGSEGV, Segmentation fault with stack frame inspection',
    log: `Program received signal SIGSEGV, Segmentation fault.
0x000055555555523a in SessionManager::getActiveSession (this=0x0, userId=1042) at src/core/session_manager.cpp:58
58	    return m_sessions.at(userId);
(gdb) bt full
#0  0x000055555555523a in SessionManager::getActiveSession (this=0x0, userId=1042) at src/core/session_manager.cpp:58
        userId = 1042
#1  0x0000555555555312 in handleRequest (req=0x7fffffffe1a0) at src/net/request_handler.cpp:114
        session = <optimized out>
        user_id = 1042
#2  0x0000555555555480 in main (argc=1, argv=0x7fffffffe348) at src/main.cpp:24
        server = {m_port = 8080, m_running = true}
(gdb) info registers
rax            0x0                 0
rbx            0x7fffffffe1a0      140737488347552
rcx            0x555555556010      93824992256016
rip            0x000055555555523a <SessionManager::getActiveSession(int)+26>`,
  },
];
