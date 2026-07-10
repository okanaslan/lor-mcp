---
name: okan-respond-process
description: Okan's concise communication workflow. Use when drafting or simplifying deployment notes, PR/review replies, status updates, operational messages, stakeholder emails, GitHub comments, or short responses that should be plain, direct, and verification-oriented.
---

# Okan Respond Process

Use this skill for short operational communication.

## Style

- Keep the message short and plain.
- Say what changed or what is needed.
- Avoid overexplaining implementation details.
- End with a simple verification request when the recipient needs to check something.
- Do not mention AI assistance.
- Do not include spec or task-section references in user-facing messages.

## Common Shapes

### Deployment success

```text
The management and investor frontends have been deployed.
Could you please check them on your side and confirm everything looks good?
```

### Permission blocker

```text
The upload is blocked by missing S3 permission: `s3:PutObject`.
Could you please update the bucket policy or IAM permissions and let me know when I should retry?
```

### PR review reply

```text
Updated this path to validate the value at the boundary and removed the downstream fallback.
Could you please re-check the flow?
```

## Review Before Sending

Check that the message:

- names the concrete action or blocker.
- avoids blame.
- asks for exactly one next action when possible.
- is easy to forward as-is.
