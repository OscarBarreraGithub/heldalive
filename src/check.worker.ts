import { scoreAnswers } from "../shared/experiments";
import type { AuditJob } from "../shared/protocol";
self.onmessage = (event: MessageEvent<AuditJob>) => {
  const job = event.data;
  self.postMessage({
    type: "audit_done",
    id: job.id,
    correct: scoreAnswers(job.answers, job.expected),
  });
};
