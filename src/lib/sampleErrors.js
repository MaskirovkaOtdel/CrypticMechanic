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
];
