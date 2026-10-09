"""
(S) Assessment Bank Service - Comprehensive 4-Category Technical Question Repository
Contains job-calibrated, multi-language question pools across:
1. Technical (MCQs & Concepts)
2. Scenario (Real-World Architecture & Problem Solving)
3. Hands-on (Practical Coding in Python, JS, Java, C++, TS)
4. Troubleshooting (Live Code Debugging & Bug-Fixing)
"""
from typing import Dict, List, Any, Optional
import random

# ─────────────────────────────────────────────────────────────────────────────
# 1. TECHNICAL MCQs & CONCEPTUAL QUESTIONS
# ─────────────────────────────────────────────────────────────────────────────
TECHNICAL_MCQS: List[Dict[str, Any]] = [
    # Python & Backend
    {
        "id": "mcq-py-gil",
        "category": "technical",
        "skills": ["python", "backend", "concurrency", "fastapi"],
        "difficulty": "Mid-Level",
        "question": "In standard CPython, how does the Global Interpreter Lock (GIL) affect multithreaded performance?",
        "options": {
            "A": "It enables full parallel CPU execution across multiple physical cores using threading.Thread.",
            "B": "It prevents multiple native threads from executing Python bytecode simultaneously, making threading effective for I/O-bound tasks but not CPU-bound tasks.",
            "C": "It automatically converts recursive function calls into iterative loops to prevent stack overflows.",
            "D": "It forces all database connections to serialize onto a single shared socket connection."
        },
        "correct_option": "B",
        "explanation": "CPython's GIL ensures thread safety by allowing only one native thread to execute Python bytecode at a time. It excels at concurrent I/O waits, while CPU-bound parallel workloads require multiprocessing or native C extensions."
    },
    {
        "id": "mcq-py-generators",
        "category": "technical",
        "skills": ["python", "backend", "performance"],
        "difficulty": "Mid-Level",
        "question": "Why is using a generator expression or 'yield' preferred over list comprehensions when streaming 10 million database rows?",
        "options": {
            "A": "Generators compress the data using gzip before storing it in memory.",
            "B": "Generators evaluate lazily on-demand, consuming O(1) memory instead of allocating memory for all 10 million objects up-front.",
            "C": "Generators bypass Python's type checking system for faster execution.",
            "D": "Generators automatically distribute database rows across multiple GPU tensor cores."
        },
        "correct_option": "B",
        "explanation": "Generators produce items one at a time on-demand via the iterator protocol, maintaining minimal memory overhead (O(1)) rather than allocating space for the entire collection."
    },
    {
        "id": "mcq-sql-indexing",
        "category": "technical",
        "skills": ["sql", "database", "postgresql", "backend"],
        "difficulty": "Mid-Level",
        "question": "Given a composite B-Tree index on (company_id, created_at, status), which of the following queries CANNOT efficiently utilize this index?",
        "options": {
            "A": "SELECT * FROM jobs WHERE company_id = 'c1' AND created_at >= '2026-01-01'",
            "B": "SELECT * FROM jobs WHERE company_id = 'c1' AND status = 'Active'",
            "C": "SELECT * FROM jobs WHERE created_at >= '2026-01-01' AND status = 'Active'",
            "D": "SELECT * FROM jobs WHERE company_id = 'c1' AND created_at = '2026-02-01' AND status = 'Active'"
        },
        "correct_option": "C",
        "explanation": "B-Tree composite indexes follow the leftmost prefix rule. A query filtering only on created_at and status without specifying the leading column (company_id) cannot use the composite index efficiently."
    },
    {
        "id": "mcq-db-acid",
        "category": "technical",
        "skills": ["sql", "database", "system design", "backend"],
        "difficulty": "Senior",
        "question": "Under PostgreSQL's default READ COMMITTED transaction isolation level, which phenomenon is prevented, and which can still occur?",
        "options": {
            "A": "Dirty reads are prevented; non-repeatable reads and phantom reads can still occur.",
            "B": "All anomalies including phantom reads are completely eliminated.",
            "C": "Dirty reads and non-repeatable reads are both prevented; only serialization anomalies occur.",
            "D": "No anomalies are prevented without an explicit table-level lock."
        },
        "correct_option": "A",
        "explanation": "READ COMMITTED guarantees that any data read was committed prior to the query start (no dirty reads). However, concurrent commits can cause subsequent SELECTs in the same transaction to see newly committed rows (non-repeatable or phantom reads)."
    },

    # React & Frontend
    {
        "id": "mcq-react-reconciliation",
        "category": "technical",
        "skills": ["react", "frontend", "javascript", "typescript"],
        "difficulty": "Mid-Level",
        "question": "What is the primary danger of using array indices as 'key' props in dynamic React lists that support reordering or item deletion?",
        "options": {
            "A": "React will throw an uncaught runtime syntax exception during compilation.",
            "B": "Component internal state (like input focus or form state) will be incorrectly mapped to adjacent items, causing subtle visual and data bugs.",
            "C": "It disables browser CSS grid rendering completely.",
            "D": "It forces React to bypass the Virtual DOM and directly manipulate the DOM synchronously."
        },
        "correct_option": "B",
        "explanation": "React's reconciliation algorithm uses 'key' to identify which items have changed, been added, or removed. Index keys mutate when items are inserted or deleted, causing React to associate existing subtrees and local state with the wrong data item."
    },
    {
        "id": "mcq-react-hooks",
        "category": "technical",
        "skills": ["react", "frontend", "javascript", "typescript"],
        "difficulty": "Mid-Level",
        "question": "In React 18, what causes a 'stale closure' inside a useEffect or useCallback hook?",
        "options": {
            "A": "Running React in StrictMode during development.",
            "B": "Omitting a mutable state variable or prop from the hook's dependency array, causing the hook function to capture older values from previous render scopes.",
            "C": "Using TypeScript interfaces instead of types.",
            "D": "Calling setState inside an event handler instead of inside requestAnimationFrame."
        },
        "correct_option": "B",
        "explanation": "JavaScript closures capture variable references from the scope in which they were created. If dependencies aren't declared, the callback retains the variables from the initial render and never sees updated values."
    },
    {
        "id": "mcq-web-perf",
        "category": "technical",
        "skills": ["react", "frontend", "performance", "javascript"],
        "difficulty": "Mid-Level",
        "question": "Which of the following practices most effectively reduces Cumulative Layout Shift (CLS) on a rich dashboard?",
        "options": {
            "A": "Loading all CSS stylesheets asynchronously using JavaScript eval.",
            "B": "Reserving aspect-ratio bounding boxes or explicit width/height dimensions for dynamic images, video containers, and ad slots.",
            "C": "Converting all SVG icons into high-resolution uncompressed BMP files.",
            "D": "Rendering the entire page inside an HTML5 iframe with zero margins."
        },
        "correct_option": "B",
        "explanation": "CLS measures unexpected layout shifts. Reserving exact dimensions or aspect ratios ensures the browser reserves the layout geometry before assets or asynchronous streams finish loading."
    },

    # Systems, Cloud & Concurrency
    {
        "id": "mcq-api-idempotency",
        "category": "technical",
        "skills": ["api", "system design", "backend", "cloud"],
        "difficulty": "Mid-Level",
        "question": "In financial or recruitment payment APIs, what is the purpose of an 'Idempotency-Key' HTTP header in POST requests?",
        "options": {
            "A": "To encrypt the request payload using AES-256 before transmission.",
            "B": "To ensure that if a client retries a timed-out network request, the server executes the mutation exactly once and returns the cached result without duplicate processing.",
            "C": "To authenticate the user without requiring a bearer token or session cookie.",
            "D": "To force the API gateway to compress the HTTP response using brotli."
        },
        "correct_option": "B",
        "explanation": "An idempotency key allows clients to safely retry requests without fear of accidentally processing the same operation twice (e.g. charging a card or submitting double applications)."
    },

    # Cloud, AWS, Containers & DevOps
    {
        "id": "mcq-aws-iam-least-privilege",
        "category": "technical",
        "skills": ["aws", "cloud", "iam", "security", "devops"],
        "difficulty": "Mid-Level",
        "question": "When running containerized microservices on AWS (e.g. on EC2 or EKS), what is the AWS best practice for granting temporary permissions to access S3 or DynamoDB?",
        "options": {
            "A": "Hardcode AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the Docker container environment variables.",
            "B": "Attach an IAM Role via EC2 Instance Profile or EKS IRSA (IAM Roles for Service Accounts) to dynamically retrieve short-lived STS credentials without storing long-lived keys.",
            "C": "Store AWS root account credentials in a plain JSON config file mounted via an NFS share.",
            "D": "Create a shared IAM User with AdministratorAccess and distribute its credentials across git submodules."
        },
        "correct_option": "B",
        "explanation": "IAM Roles for Service Accounts (IRSA) and Instance Profiles use the AWS Security Token Service (STS) to issue temporary, rotating credentials, eliminating the high security risk of static long-lived access keys."
    },
    {
        "id": "mcq-aws-vpc-architecture",
        "category": "technical",
        "skills": ["aws", "cloud", "networking", "vpc", "security"],
        "difficulty": "Mid-Level",
        "question": "In a production AWS VPC design, how should private backend microservices initiate outbound connections to external APIs while remaining unreachable from the public internet?",
        "options": {
            "A": "Attach an Internet Gateway directly to the private subnet routing table.",
            "B": "Place a NAT Gateway in a public subnet with an Elastic IP, and route 0.0.0.0/0 traffic from the private subnet route table to this NAT Gateway.",
            "C": "Assign public IPv4 addresses to every private backend container.",
            "D": "Disable the VPC firewall and bridge all traffic onto AWS Direct Connect."
        },
        "correct_option": "B",
        "explanation": "A NAT Gateway residing in a public subnet translates outbound traffic from private instances to its Elastic IP, allowing private workloads to pull updates or reach external APIs without accepting inbound internet connections."
    },
    {
        "id": "mcq-docker-multistage",
        "category": "technical",
        "skills": ["docker", "docket", "containers", "devops", "cloud"],
        "difficulty": "Mid-Level",
        "question": "Why are Docker multi-stage builds considered essential for deploying production container images?",
        "options": {
            "A": "They allow running multiple isolated Linux operating systems inside a single container instance.",
            "B": "They separate the build environment (compilers, SDKs, devDependencies) from the lean runtime image, minimizing image size and attack surface.",
            "C": "They automatically encrypt all HTTP traffic between Docker containers using TLS.",
            "D": "They bypass Docker daemon socket permissions by executing directly in host kernel space."
        },
        "correct_option": "B",
        "explanation": "Multi-stage builds leave behind compilers, header files, and build tools in temporary intermediate stages, copying only the compiled artifacts into a minimal runtime image (e.g. Alpine or Distroless)."
    },
    {
        "id": "mcq-k8s-probes",
        "category": "technical",
        "skills": ["kubernetes", "k8s", "cloud", "devops", "containers"],
        "difficulty": "Senior",
        "question": "What is the critical distinction between a Kubernetes 'Liveness Probe' and a 'Readiness Probe'?",
        "options": {
            "A": "Liveness probes trigger container restarts when an unrecoverable deadlock occurs, while failed Readiness probes temporarily remove the Pod from Service endpoints without restarting it.",
            "B": "Readiness probes terminate the node immediately, while Liveness probes only send an email alert.",
            "C": "Liveness probes are strictly evaluated during cluster initial boot, while Readiness probes only run during shutdown.",
            "D": "They are completely identical and interchangeable aliases within the Kubernetes API spec."
        },
        "correct_option": "A",
        "explanation": "Liveness probes detect deadlocks or fatal crashes and restart the container. Readiness probes detect whether the pod is ready to accept incoming network traffic, gracefully isolating overloaded or warming pods."
    },
    {
        "id": "mcq-k8s-deployments-vs-statefulsets",
        "category": "technical",
        "skills": ["kubernetes", "k8s", "cloud", "database", "devops"],
        "difficulty": "Senior",
        "question": "When deploying a stateful clustered workload (like Kafka, Elasticsearch, or PostgreSQL) on Kubernetes, why is a StatefulSet preferred over a standard Deployment?",
        "options": {
            "A": "StatefulSets provide stable, unique network identifiers (ordinal pod names), dedicated PersistentVolume claims per replica, and ordered graceful deployment and scaling.",
            "B": "Deployments do not support CPU or memory resource limits.",
            "C": "StatefulSets run exclusively on AWS bare-metal instances without requiring kubelet.",
            "D": "Deployments cannot attach any storage volumes whatsoever."
        },
        "correct_option": "A",
        "explanation": "StatefulSets maintain sticky identity for each pod (pod-0, pod-1) and bind dedicated persistent storage volumes that persist across rescheduling, essential for distributed stateful systems."
    },
    {
        "id": "mcq-aws-s3-consistency",
        "category": "technical",
        "skills": ["aws", "cloud", "storage", "s3", "system design"],
        "difficulty": "Mid-Level",
        "question": "What consistency model does Amazon S3 guarantee for PUT and DELETE requests of new and existing objects?",
        "options": {
            "A": "Eventual consistency with a mandatory 15-minute propagation delay across availability zones.",
            "B": "Strong read-after-write consistency for PUTs and DELETEs of objects in all AWS Regions across all buckets.",
            "C": "Read-uncommitted consistency requiring explicit conditional locks before each read.",
            "D": "Strict linearizability across multi-cloud replication only."
        },
        "correct_option": "B",
        "explanation": "Amazon S3 provides strong read-after-write consistency for PUTs and DELETEs of objects in all AWS regions automatically, without changes to performance or availability."
    },
    {
        "id": "mcq-docker-caching",
        "category": "technical",
        "skills": ["docker", "docket", "devops", "ci/cd", "containers"],
        "difficulty": "Mid-Level",
        "question": "In a Dockerfile, why is it best practice to copy dependency manifest files (like package.json or requirements.txt) and run dependency installation BEFORE copying the rest of the application source code?",
        "options": {
            "A": "Because Docker cannot read source code if third-party packages are copied second.",
            "B": "To leverage Docker's layer cache so that heavy dependency installations are skipped if package manifests have not changed, speeding up build times.",
            "C": "To prevent source files from overwriting system kernel headers.",
            "D": "To enable automatic git commit verification during container compilation."
        },
        "correct_option": "B",
        "explanation": "Docker caches each build layer. Placing infrequently changing files (dependency manifests) before frequently changing files (source code) avoids invalidating the cache on every code change."
    },
    {
        "id": "mcq-cloud-alb-nlb",
        "category": "technical",
        "skills": ["aws", "cloud", "networking", "devops", "system design"],
        "difficulty": "Senior",
        "question": "When architecting traffic routing on AWS, under which scenario should an engineer choose a Network Load Balancer (NLB) over an Application Load Balancer (ALB)?",
        "options": {
            "A": "When advanced HTTP/HTTPS path-based and host-header routing rules are required.",
            "B": "When ultra-low latency, extreme millions-of-requests-per-second throughput at Layer 4 (TCP/UDP), and static IP allocations are required.",
            "C": "When terminating WebSocket connections with custom HTTP response headers.",
            "D": "When routing traffic directly to AWS Lambda serverless functions."
        },
        "correct_option": "B",
        "explanation": "NLB operates at the transport layer (Layer 4) for extreme throughput, sub-millisecond latencies, and provides static Anycast IP addresses, whereas ALB operates at Layer 7 (HTTP/HTTPS)."
    },

    # ─── Finance, Accounting, Tax & Audit (Senior Controller & Financial Auditor) ───
    {
        "id": "mcq-fin-rev-rec",
        "category": "finance",
        "skills": ["finance", "accounting", "ifrs", "gaap", "revenue recognition", "financial reporting"],
        "difficulty": "Senior",
        "question": "Under IFRS 15 / ASC 606 (Revenue from Contracts with Customers), when must variable consideration (such as performance bonuses or volume discounts) be included in the transaction price?",
        "options": {
            "A": "Only after the contract has been completely fulfilled and final payment is received.",
            "B": "Only to the extent it is highly probable that a significant reversal in cumulative revenue recognized will not occur when the uncertainty is resolved.",
            "C": "It must always be included immediately at the maximum contractually stated value regardless of uncertainty.",
            "D": "It must be amortized straight-line over a mandatory 5-year statutory period."
        },
        "correct_option": "B",
        "explanation": "IFRS 15 paragraph 56 sets the constraint on variable consideration: it is included in transaction price only if it is highly probable that a significant reversal will not occur once uncertainty resolves."
    },
    {
        "id": "mcq-fin-lease-ifrs16",
        "category": "finance",
        "skills": ["finance", "accounting", "ifrs", "financial reporting"],
        "difficulty": "Senior",
        "question": "Under IFRS 16, how does a lessee recognize an operating facility lease on the balance sheet at commencement date?",
        "options": {
            "A": "Off-balance sheet as periodic rental expense in operating expenses without any asset or liability recognition.",
            "B": "Recognize a Right-of-Use (ROU) asset and a lease liability measured at the present value of future lease payments discounted using the incremental borrowing rate.",
            "C": "As a contingent liability disclosed only in the footnotes until the lease reaches 50% maturity.",
            "D": "At historical cost as fixed property, plant, and equipment with no corresponding financial liability."
        },
        "correct_option": "B",
        "explanation": "IFRS 16 eliminated the distinction between operating and finance leases for lessees. Lessees recognize an ROU asset and lease liability discounted at the present value of future lease payments."
    },
    {
        "id": "mcq-fin-tax-deferred",
        "category": "finance",
        "skills": ["taxation", "tax audit", "accounting", "ifrs", "compliance", "finance"],
        "difficulty": "Senior",
        "question": "Under IAS 12 (Income Taxes), what condition creates a Deferred Tax Asset (DTA), and what is the required criterion for its recognition on the balance sheet?",
        "options": {
            "A": "When accounting income is permanently higher than tax income; recognized unconditionally forever.",
            "B": "When deductible temporary differences exist; recognized only to the extent probable that taxable profit will be available against which it can be utilized.",
            "C": "When tax rates increase unexpectedly in foreign jurisdictions; recognized as an extraordinary gain in P&L.",
            "D": "Only when the company is in liquidation and files an immediate tax refund claim."
        },
        "correct_option": "B",
        "explanation": "A DTA arises from deductible temporary differences or unused tax loss carryforwards. IAS 12 requires that a DTA be recognized only to the extent that it is probable future taxable profits will be available."
    },
    {
        "id": "mcq-fin-audit-risk",
        "category": "finance",
        "skills": ["auditing", "tax audit", "internal controls", "compliance", "finance"],
        "difficulty": "Senior",
        "question": "In the professional Audit Risk Model (Audit Risk = Inherent Risk × Control Risk × Detection Risk), if the auditor determines that Internal Controls are ineffective (Control Risk is High), how must the auditor respond to maintain acceptable overall Audit Risk?",
        "options": {
            "A": "Increase Detection Risk by reducing substantive audit procedures and relying on management representations.",
            "B": "Lower Detection Risk by expanding the nature, timing, and extent of substantive testing and increasing sample sizes.",
            "C": "Immediately issue an adverse audit opinion without performing substantive testing.",
            "D": "Double the Inherent Risk assessment to mathematically balance the equation."
        },
        "correct_option": "B",
        "explanation": "Detection risk is the only component the auditor controls. When Control Risk is High, the auditor must reduce Detection Risk by conducting more rigorous and extensive substantive testing."
    },
    {
        "id": "mcq-fin-transfer-pricing",
        "category": "finance",
        "skills": ["taxation", "tax audit", "transfer pricing", "compliance", "finance"],
        "difficulty": "Senior",
        "question": "Under OECD Transfer Pricing Guidelines (BEPS Action 13), what is the core standard applied to cross-border intercompany transactions between associated enterprises?",
        "options": {
            "A": "Cost-plus 0% to minimize customs duties in all jurisdictions.",
            "B": "The Arm's Length Principle: transactions must be priced as if they occurred between independent, unrelated entities under comparable market circumstances.",
            "C": "Total tax elimination by routing all intellectual property royalties to tax havens with zero economic substance.",
            "D": "Mandatory consolidation under the parent entity's domestic tax code without local documentation."
        },
        "correct_option": "B",
        "explanation": "The cornerstone of transfer pricing is the Arm's Length Principle (Article 9 OECD Model Convention), requiring pricing between related entities to match terms agreed between independent market players."
    },
    {
        "id": "mcq-fin-sox404-weakness",
        "category": "finance",
        "skills": ["internal controls", "auditing", "compliance", "sox", "finance"],
        "difficulty": "Senior",
        "question": "Under Sarbanes-Oxley (SOX) Section 404, what distinguishes a 'Material Weakness' from a 'Significant Deficiency' in internal control over financial reporting (ICFR)?",
        "options": {
            "A": "A significant deficiency always requires a restatement of prior period financial statements, while a material weakness does not.",
            "B": "A material weakness is a deficiency, or combination thereof, such that there is a reasonable possibility that a material misstatement will not be prevented or detected on a timely basis.",
            "C": "A material weakness only applies to cash fraud committed by executive officers.",
            "D": "A significant deficiency is disclosed to the SEC, whereas a material weakness is handled exclusively internally by management."
        },
        "correct_option": "B",
        "explanation": "Under PCAOB standards, a Material Weakness creates a reasonable possibility of a material misstatement not being prevented/detected, resulting in an adverse opinion on internal controls."
    },
    {
        "id": "mcq-fin-variance-ebitda",
        "category": "finance",
        "skills": ["financial analysis", "finance", "accounting", "variance analysis"],
        "difficulty": "Mid-Level",
        "question": "When performing an EBITDA bridge variance analysis between Budget ($10M) and Actual ($8M), which breakdown correctly attributes the root causes of the variance?",
        "options": {
            "A": "Depreciating older equipment faster than straight-line schedules.",
            "B": "Decomposing the $2M shortfall into Volume Variance, Price/Mix Variance, Cost of Goods Sold (COGS) Input Cost Variance, and Operating Expense (OpEx) Variance.",
            "C": "Reallocating interest expense and tax provisions from financing activities.",
            "D": "Amortizing intangible assets through other comprehensive income (OCI)."
        },
        "correct_option": "B",
        "explanation": "A standard EBITDA bridge decomposes budget variances into Volume (quantity sold), Price/Mix (selling price and product composition), Input Costs (raw materials/direct labor), and OpEx."
    },
    {
        "id": "mcq-fin-cashflow-indirect",
        "category": "finance",
        "skills": ["accounting", "finance", "financial reporting", "cash flow"],
        "difficulty": "Mid-Level",
        "question": "In the Indirect Method of the Statement of Cash Flows (IAS 7 / ASC 230), how does an increase in Accounts Receivable and an increase in Accounts Payable affect Cash Flow from Operating Activities?",
        "options": {
            "A": "Both increases are added back to Net Income.",
            "B": "Increase in Accounts Receivable is deducted (cash not collected), while increase in Accounts Payable is added back (cash payment postponed).",
            "C": "Increase in Accounts Receivable is added, while increase in Accounts Payable is deducted.",
            "D": "Both increases are classified under Cash Flow from Financing Activities."
        },
        "correct_option": "B",
        "explanation": "Under the indirect method: an increase in Accounts Receivable consumes operating cash (subtracted), whereas an increase in Accounts Payable conserves cash (added back)."
    },
    {
        "id": "mcq-fin-impairment-ias36",
        "category": "finance",
        "skills": ["financial reporting", "accounting", "ifrs", "valuation", "finance"],
        "difficulty": "Senior",
        "question": "Under IAS 36 (Impairment of Assets), an asset's Recoverable Amount is defined as the higher of which two metrics?",
        "options": {
            "A": "Historical cost less accumulated depreciation and replacement cost.",
            "B": "Fair Value less costs of disposal, and Value in Use (discounted present value of expected future cash flows).",
            "C": "Current liquidation auction value and book value of equity.",
            "D": "Insurable replacement value and statutory tax depreciable base."
        },
        "correct_option": "B",
        "explanation": "IAS 36 paragraph 18 specifies Recoverable Amount = max(Fair Value Less Costs of Disposal, Value in Use). An impairment loss is recognized if carrying value exceeds this recoverable amount."
    },
    {
        "id": "mcq-fin-ecl-ifrs9",
        "category": "finance",
        "skills": ["finance", "ifrs", "financial reporting", "compliance"],
        "difficulty": "Senior",
        "question": "Under IFRS 9 Financial Instruments, how does the 3-stage Expected Credit Loss (ECL) model evaluate credit risk on loan receivables?",
        "options": {
            "A": "Losses are only recognized when an actual legal bankruptcy or payment default has occurred (incurred loss model).",
            "B": "Stage 1 recognizes 12-month ECL; Stage 2 (significant increase in credit risk) and Stage 3 (credit-impaired) recognize Lifetime ECL.",
            "C": "A flat 1% general provision is deducted from all receivables regardless of individual creditworthiness.",
            "D": "All credit loss evaluations are deferred until maturity of the underlying instrument."
        },
        "correct_option": "B",
        "explanation": "IFRS 9 replaced the legacy incurred loss model with forward-looking ECL: Stage 1 = 12-month ECL, Stage 2 (significant deterioration) = Lifetime ECL, Stage 3 = Lifetime ECL."
    },
    {
        "id": "mcq-fin-working-capital",
        "category": "finance",
        "skills": ["finance", "financial analysis", "cash flow", "working capital"],
        "difficulty": "Mid-Level",
        "question": "How is the Cash Conversion Cycle (CCC) calculated, and what does a decreasing CCC indicate about a company's operational efficiency?",
        "options": {
            "A": "CCC = Days Sales Outstanding (DSO) - Days Inventory Outstanding (DIO) + Days Payables Outstanding (DPO); indicates longer asset freeze.",
            "B": "CCC = Days Inventory Outstanding (DIO) + Days Sales Outstanding (DSO) - Days Payables Outstanding (DPO); a decreasing CCC indicates faster liquidity conversion and superior working capital management.",
            "C": "CCC = Quick Ratio × Current Ratio; indicates higher debt leverage.",
            "D": "CCC = Net Profit Margin ÷ Total Asset Turnover; indicates DuPont return on equity."
        },
        "correct_option": "B",
        "explanation": "CCC = DIO + DSO - DPO. A lower CCC means the firm converts investments in inventory and resources into cash flows much faster."
    },
    {
        "id": "mcq-fin-consolidation-nci",
        "category": "finance",
        "skills": ["accounting", "ifrs", "financial reporting", "consolidation", "finance"],
        "difficulty": "Senior",
        "question": "When preparing consolidated financial statements under IFRS 10, how is a Non-Controlling Interest (NCI) presented in the Consolidated Statement of Financial Position?",
        "options": {
            "A": "As a current liability due within 12 months to outside minority shareholders.",
            "B": "Within total equity, but presented separately from the equity of the parent company's shareholders.",
            "C": "As an off-balance sheet contingent commitment disclosed only in notes.",
            "D": "Deducted directly from goodwill on the asset side of the balance sheet."
        },
        "correct_option": "B",
        "explanation": "IFRS 10 paragraph 22 mandates that Non-Controlling Interests (NCI) be presented within equity in the consolidated statement of financial position, separately from parent shareholders."
    },
    {
        "id": "mcq-fin-tax-ifric23",
        "category": "finance",
        "skills": ["taxation", "tax audit", "compliance", "ifrs", "finance"],
        "difficulty": "Senior",
        "question": "Under IFRIC 23 (Uncertainty over Income Tax Treatments), when is an entity required to reflect the effect of uncertainty in determining taxable profit, tax bases, or tax rates?",
        "options": {
            "A": "Only after the tax authority has formally initiated a criminal tax evasion prosecution.",
            "B": "If the entity concludes it is NOT probable that the taxation authority will accept an uncertain tax treatment, using either the most likely amount or the expected value method.",
            "C": "Whenever the effective tax rate drops below 15% globally.",
            "D": "Only when the tax filing is older than 7 statutory limitation years."
        },
        "correct_option": "B",
        "explanation": "IFRIC 23 requires that if it is not probable the tax authority will accept the treatment, the entity must reflect uncertainty using the most likely amount or expected value method."
    },
    {
        "id": "mcq-fin-forensic-audit",
        "category": "finance",
        "skills": ["auditing", "tax audit", "compliance", "internal controls", "finance"],
        "difficulty": "Senior",
        "question": "During a tax and statutory forensic audit, which analytical indicator is a prominent red flag for potential fraudulent financial reporting or fictitious revenue generation?",
        "options": {
            "A": "Days Sales Outstanding (DSO) increasing substantially while industry peers are flat, paired with uncollected receivables concentrated in the final week of the fiscal year.",
            "B": "A decrease in administrative travel expenses following remote work policy adoption.",
            "C": "Consistent payment of declared dividends from retained earnings.",
            "D": "Early vendor invoice payments to capture 2/10 net 30 cash discount terms."
        },
        "correct_option": "A",
        "explanation": "Surges in uncollected receivables at fiscal year-end combined with swelling DSO are classic symptoms of premature revenue recognition, bill-and-hold transactions, or fictitious channel-stuffing."
    },
    {
        "id": "mcq-fin-cost-breakeven",
        "category": "finance",
        "skills": ["finance", "accounting", "cost accounting", "financial analysis"],
        "difficulty": "Mid-Level",
        "question": "If a division has Fixed Costs of $1,200,000, selling price per unit of $150, and Variable Cost per unit of $90, what is the Breakeven Point in sales dollars?",
        "options": {
            "A": "$1,200,000",
            "B": "$3,000,000",
            "C": "$2,000,000",
            "D": "$4,500,000"
        },
        "correct_option": "B",
        "explanation": "Contribution Margin Ratio = ($150 - $90) / $150 = $60 / $150 = 40% (0.40). Breakeven Sales = Fixed Costs / CM Ratio = $1,200,000 / 0.40 = $3,000,000."
    }
]

# ─────────────────────────────────────────────────────────────────────────────
# 2. SCENARIO ENGINEERING QUESTIONS (Real-World Architecture & Systems)
# ─────────────────────────────────────────────────────────────────────────────
SCENARIO_QUESTIONS: List[Dict[str, Any]] = [
    {
        "id": "sc-db-exhaustion",
        "category": "scenario",
        "skills": ["backend", "database", "python", "system design", "postgresql"],
        "difficulty": "Senior",
        "title": "Database Connection Pool Exhaustion under Peak Traffic",
        "prompt": "During a massive hiring campaign, candidate traffic spikes 10x. Your API latency jumps from 45ms to 3.8s, and logs show 'FATAL: remaining connection slots are reserved for non-replication superuser connections' and 'QueuePool limit of size 20 overflow 10 reached'. Describe how you diagnose the root cause immediately, implement an emergency mitigation, and architect a long-term resilient solution.",
        "rubric_keywords": ["connection pooling", "pgbouncer", "slow query", "transaction duration", "read replica", "timeout", "circuit breaker"],
        "guidance": "Focus on connection lifecycle, pool sizing vs CPU cores, separating read vs write traffic, and tuning transaction scopes."
    },
    {
        "id": "sc-cache-stampede",
        "category": "scenario",
        "skills": ["backend", "system design", "algorithms", "cloud"],
        "difficulty": "Mid-Level",
        "title": "Mitigating Cache Stampede on Job Catalog Endpoints",
        "prompt": "Your popular job listings cache in Redis expires simultaneously every 15 minutes. When it expires, 15,000 concurrent candidate requests miss the cache at the exact same millisecond and bombard the underlying PostgreSQL database, threatening a complete outage. Explain at least two distinct architectural patterns you would implement to prevent this 'thundering herd' phenomenon.",
        "rubric_keywords": ["probabilistic early expiration", "xfetch", "mutex", "distributed lock", "background refresh", "stale-while-revalidate", "jitter"],
        "guidance": "Address jittered TTLs, stale-while-revalidate with background workers, or distributed lock / single-flight patterns."
    },
    {
        "id": "sc-realtime-proctor",
        "category": "scenario",
        "skills": ["react", "frontend", "webrtc", "javascript", "performance"],
        "difficulty": "Senior",
        "title": "Handling Packet Loss & Jitter in Live Video Proctored Assessments",
        "prompt": "Candidates in remote regions take live AI video interviews on unstable 4G networks experiencing 20% UDP packet loss, variable latency, and occasional tab switches. How would you architect the client-side telemetry and video transport to ensure proctoring integrity events are guaranteed to reach the server without dropping data or freezing the candidate's browser thread?",
        "rubric_keywords": ["indexeddb", "offline queue", "service worker", "retry with backoff", "webrtc data channel", "bandwidth adaptation", "web worker"],
        "guidance": "Cover local offline persistence (IndexedDB), worker threads to decouple video processing from UI, and guaranteed delivery protocols for integrity events."
    },
    {
        "id": "sc-microservice-migration",
        "category": "scenario",
        "skills": ["backend", "system design", "cloud", "devops"],
        "difficulty": "Senior",
        "title": "Zero-Downtime Data Migration for Job Applications Table",
        "prompt": "You need to migrate the 'applications' table (50 million rows) to a new schema that supports multi-tenant sharding and encrypted candidate resumes without taking the platform offline. Detail your deployment strategy, data migration pipeline, and rollback mechanisms.",
        "rubric_keywords": ["strangler fig", "dual-write", "shadow read", "feature flag", "backfill", "cdc", "reconciliation script", "zero downtime"],
        "guidance": "Explain dual-write phase, background historical backfill, shadow verification/reconciliation, and atomic cutover with feature flags."
    },
    {
        "id": "sc-cloud-k8s-oom",
        "category": "scenario",
        "skills": ["aws", "kubernetes", "k8s", "cloud", "docker", "docket", "devops"],
        "difficulty": "Senior",
        "title": "Kubernetes CrashLoopBackOff & OOMKilled Emergency in Production",
        "prompt": "Following a new microservice release on AWS EKS, 60% of candidate-facing pods enter 'CrashLoopBackOff' and 'OOMKilled' (Exit Code 137). API error rates spike to 35%. Describe your step-by-step incident triage: how you inspect pod events and container metrics, roll back or patch resource limits/requests, investigate memory leak vs container allocation, and prevent future occurrences using HPA and resource quotas.",
        "rubric_keywords": ["kubectl describe", "oomkilled", "exit code 137", "requests and limits", "metrics-server", "rollback", "heap dump", "hpa", "memory leak"],
        "guidance": "Focus on immediate triage (`kubectl describe pod`, `kubectl logs --previous`), rolling back via deployment revision, adjusting cgroup memory limits, and setting pod disruption budgets."
    },
    {
        "id": "sc-aws-disaster-recovery",
        "category": "scenario",
        "skills": ["aws", "cloud", "system design", "networking", "devops"],
        "difficulty": "Senior",
        "title": "Architecting Active-Passive Disaster Recovery on AWS",
        "prompt": "Your recruitment platform must achieve an RTO (Recovery Time Objective) under 5 minutes and an RPO (Recovery Point Objective) under 1 minute in the event of an entire AWS Region outage (e.g. us-east-1). Detail your architecture covering Route53 DNS health checks, Aurora Global Database or cross-region RDS read replicas, S3 Cross-Region Replication (CRR), and automated failover orchestration.",
        "rubric_keywords": ["route 53", "dns failover", "rto", "rpo", "cross-region replication", "aurora global database", "health check", "terraform", "s3 crr"],
        "guidance": "Detail data tier replication (Aurora Global DB / Cross-region read replicas), stateless app tier scaling in secondary region, and Route53 DNS health check failover."
    },
    {
        "id": "sc-fin-tax-audit-dispute",
        "category": "scenario",
        "skills": ["taxation", "tax audit", "compliance", "finance", "transfer pricing", "accounting"],
        "difficulty": "Senior",
        "title": "Cross-Border Transfer Pricing & Tax Audit Assessment Defense",
        "prompt": "The State Tax Authority issues a formal audit assessment disallowing $4.2M in intercompany intellectual property royalties paid by your domestic subsidiary to your European headquarters over the past three fiscal years, assessing back taxes, 20% penalties, and interest. As Senior Financial Controller & Tax Auditor, outline your defense strategy: from assembling contemporaneous transfer pricing documentation and functional analysis to pursuing mutual agreement procedures (MAP) and evaluating deferred tax provision adjustments.",
        "rubric_keywords": ["transfer pricing", "arm's length", "beps", "contemporaneous documentation", "comparable uncontrolled price", "map", "ifric 23", "tax provision"],
        "guidance": "Focus on economic substance, benchmarking analysis under OECD guidelines, uncertain tax position adjustments under IFRIC 23, and dispute mitigation."
    },
    {
        "id": "sc-fin-restatement-reconciliation",
        "category": "scenario",
        "skills": ["accounting", "financial reporting", "auditing", "internal controls", "ifrs", "finance"],
        "difficulty": "Senior",
        "title": "Revenue Misstatement & Material Weakness Remediation",
        "prompt": "During year-end closing, you discover that a sales director booked $3.5M of software licenses as upfront revenue under ASC 606 / IFRS 15, despite the customer contract containing unfulfilled custom integration obligations and an unapproved return clause. Explain your step-by-step controller response: assessing materiality for prior-period restatement vs cumulative catch-up adjustment, coordinating with external auditors, and implementing preventative internal controls under SOX 404.",
        "rubric_keywords": ["asc 606", "ifrs 15", "performance obligation", "material weakness", "restatement", "sox 404", "audit committee", "remediation"],
        "guidance": "Address SAB 99 / IAS 8 qualitative and quantitative materiality assessment, SAB 108 rollover vs iron curtain approach, SEC 8-K disclosure, and internal control remediation."
    }
]

# ─────────────────────────────────────────────────────────────────────────────
# 3. HANDS-ON CODING CHALLENGES (Multi-Language: Python, JS, Java, C++, TS)
# ─────────────────────────────────────────────────────────────────────────────
HANDS_ON_CHALLENGES: List[Dict[str, Any]] = [
    {
        "id": "hands-telemetry-debounce",
        "category": "hands_on",
        "title": "Real-time Telemetry Event Aggregator & Debounce",
        "difficulty": "Mid-Level",
        "skills": ["algorithms", "backend", "frontend", "python", "javascript"],
        "instructions": (
            "Implement a telemetry event aggregator that collapses consecutive duplicate suspicious events "
            "(e.g., candidate switching tabs or looking away) occurring within a window of 3000ms.\n\n"
            "Input: A list/array of events where each event has:\n"
            "  - type (string)\n"
            "  - timestamp (integer in milliseconds)\n\n"
            "Output: A list/array of aggregated events where consecutive events with the SAME type within 3000ms "
            "of the previous event are combined into one event with an added/incremented 'count' property. "
            "Events of different types or separated by > 3000ms must start a new entry."
        ),
        "supported_languages": ["python", "javascript", "java", "cpp", "typescript"],
        "starter_code": {
            "python": (
                "# Implement aggregate_events(events)\n"
                "# events: list of dicts [{'type': str, 'timestamp': int}]\n"
                "# Return list of aggregated events with 'count' field\n\n"
                "def aggregate_events(events):\n"
                "    if not events:\n"
                "        return []\n"
                "    result = []\n"
                "    # Write your implementation here\n"
                "    for ev in events:\n"
                "        if not result or result[-1]['type'] != ev['type'] or (ev['timestamp'] - result[-1]['timestamp']) > 3000:\n"
                "            result.append({'type': ev['type'], 'timestamp': ev['timestamp'], 'count': 1})\n"
                "        else:\n"
                "            result[-1]['count'] += 1\n"
                "    return result\n"
            ),
            "javascript": (
                "// Implement aggregateEvents(events)\n"
                "// events: array of { type: string, timestamp: number }\n"
                "// Return array of aggregated events with 'count' field\n\n"
                "function aggregateEvents(events) {\n"
                "  if (!events || events.length === 0) return [];\n"
                "  const result = [];\n"
                "  for (const ev of events) {\n"
                "    const last = result[result.length - 1];\n"
                "    if (!last || last.type !== ev.type || (ev.timestamp - last.timestamp) > 3000) {\n"
                "      result.push({ type: ev.type, timestamp: ev.timestamp, count: 1 });\n"
                "    } else {\n"
                "      last.count += 1;\n"
                "    }\n"
                "  }\n"
                "  return result;\n"
                "}\n"
            ),
            "typescript": (
                "interface TelemetryEvent {\n"
                "  type: string;\n"
                "  timestamp: number;\n"
                "  count?: number;\n"
                "}\n\n"
                "function aggregateEvents(events: TelemetryEvent[]): TelemetryEvent[] {\n"
                "  if (!events || events.length === 0) return [];\n"
                "  const result: TelemetryEvent[] = [];\n"
                "  for (const ev of events) {\n"
                "    const last = result[result.length - 1];\n"
                "    if (!last || last.type !== ev.type || (ev.timestamp - last.timestamp) > 3000) {\n"
                "      result.push({ type: ev.type, timestamp: ev.timestamp, count: 1 });\n"
                "    } else {\n"
                "      last.count = (last.count || 1) + 1;\n"
                "    }\n"
                "  }\n"
                "  return result;\n"
                "}\n"
            ),
            "java": (
                "import java.util.*;\n\n"
                "public class Solution {\n"
                "    public static class Event {\n"
                "        public String type;\n"
                "        public long timestamp;\n"
                "        public int count;\n"
                "        public Event(String t, long ts, int c) { type = t; timestamp = ts; count = c; }\n"
                "    }\n\n"
                "    public static List<Event> aggregateEvents(List<Event> events) {\n"
                "        List<Event> result = new ArrayList<>();\n"
                "        if (events == null || events.isEmpty()) return result;\n"
                "        for (Event ev : events) {\n"
                "            if (result.isEmpty()) {\n"
                "                result.add(new Event(ev.type, ev.timestamp, 1));\n"
                "            } else {\n"
                "                Event last = result.get(result.size() - 1);\n"
                "                if (!last.type.equals(ev.type) || (ev.timestamp - last.timestamp) > 3000) {\n"
                "                    result.add(new Event(ev.type, ev.timestamp, 1));\n"
                "                } else {\n"
                "                    last.count += 1;\n"
                "                }\n"
                "            }\n"
                "        }\n"
                "        return result;\n"
                "    }\n"
                "}\n"
            ),
            "cpp": (
                "#include <iostream>\n"
                "#include <vector>\n"
                "#include <string>\n\n"
                "struct Event {\n"
                "    std::string type;\n"
                "    long long timestamp;\n"
                "    int count;\n"
                "};\n\n"
                "std::vector<Event> aggregateEvents(const std::vector<Event>& events) {\n"
                "    std::vector<Event> result;\n"
                "    if (events.empty()) return result;\n"
                "    for (const auto& ev : events) {\n"
                "        if (result.empty() || result.back().type != ev.type || (ev.timestamp - result.back().timestamp) > 3000) {\n"
                "            result.push_back({ev.type, ev.timestamp, 1});\n"
                "        } else {\n"
                "            result.back().count += 1;\n"
                "        }\n"
                "    }\n"
                "    return result;\n"
                "}\n"
            )
        },
        "test_cases": [
            {
                "name": "Debounce consecutive identical events (<3000ms)",
                "input": "[{type: 'TAB_SWITCH', timestamp: 1000}, {type: 'TAB_SWITCH', timestamp: 2500}]",
                "expected": "1 event with count=2 at timestamp 1000"
            },
            {
                "name": "Separate events exceeding debounce window (>3000ms)",
                "input": "[{type: 'TAB_SWITCH', timestamp: 1000}, {type: 'TAB_SWITCH', timestamp: 5000}]",
                "expected": "2 distinct events with count=1 each"
            },
            {
                "name": "Alternate different event types sequentially",
                "input": "[{type: 'TAB_SWITCH', timestamp: 1000}, {type: 'FACE_LOST', timestamp: 1500}]",
                "expected": "2 distinct events with count=1 each (different types)"
            }
        ]
    },
    {
        "id": "hands-token-bucket",
        "category": "hands_on",
        "title": "Token Bucket Rate Limiter with Burst Allowance",
        "difficulty": "Senior",
        "skills": ["algorithms", "system design", "backend", "python", "concurrency"],
        "instructions": (
            "Implement a TokenBucket rate limiter class.\n\n"
            "Requirements:\n"
            "- Constructor receives 'capacity' (max burst tokens) and 'refill_rate' (tokens added per second).\n"
            "- Method 'allow_request(tokens, current_time_sec)': returns True if sufficient tokens exist, "
            "deducts the tokens, and updates internal state. Returns False if insufficient tokens.\n"
            "- Tokens refill smoothly according to elapsed time since last refill, capped at capacity."
        ),
        "supported_languages": ["python", "javascript", "java", "cpp", "typescript"],
        "starter_code": {
            "python": (
                "class TokenBucket:\n"
                "    def __init__(self, capacity: float, refill_rate: float):\n"
                "        self.capacity = float(capacity)\n"
                "        self.refill_rate = float(refill_rate)\n"
                "        self.tokens = float(capacity)\n"
                "        self.last_timestamp = 0.0\n\n"
                "    def allow_request(self, tokens: float, current_time: float) -> bool:\n"
                "        # Calculate refilled tokens based on elapsed time\n"
                "        elapsed = max(0.0, current_time - self.last_timestamp)\n"
                "        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)\n"
                "        self.last_timestamp = current_time\n"
                "        if self.tokens >= tokens:\n"
                "            self.tokens -= tokens\n"
                "            return True\n"
                "        return False\n"
            ),
            "javascript": (
                "class TokenBucket {\n"
                "  constructor(capacity, refillRate) {\n"
                "    this.capacity = capacity;\n"
                "    this.refillRate = refillRate;\n"
                "    this.tokens = capacity;\n"
                "    this.lastTimestamp = 0;\n"
                "  }\n\n"
                "  allowRequest(tokens, currentTime) {\n"
                "    const elapsed = Math.max(0, currentTime - this.lastTimestamp);\n"
                "    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);\n"
                "    this.lastTimestamp = currentTime;\n"
                "    if (this.tokens >= tokens) {\n"
                "      this.tokens -= tokens;\n"
                "      return true;\n"
                "    }\n"
                "    return false;\n"
                "  }\n"
                "}\n"
            ),
            "typescript": (
                "class TokenBucket {\n"
                "  private capacity: number;\n"
                "  private refillRate: number;\n"
                "  private tokens: number;\n"
                "  private lastTimestamp: number;\n\n"
                "  constructor(capacity: number, refillRate: number) {\n"
                "    this.capacity = capacity;\n"
                "    this.refillRate = refillRate;\n"
                "    this.tokens = capacity;\n"
                "    this.lastTimestamp = 0;\n"
                "  }\n\n"
                "  allowRequest(tokens: number, currentTime: number): boolean {\n"
                "    const elapsed = Math.max(0, currentTime - this.lastTimestamp);\n"
                "    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);\n"
                "    this.lastTimestamp = currentTime;\n"
                "    if (this.tokens >= tokens) {\n"
                "      this.tokens -= tokens;\n"
                "      return true;\n"
                "    }\n"
                "    return false;\n"
                "  }\n"
                "}\n"
            ),
            "java": (
                "public class TokenBucket {\n"
                "    private double capacity;\n"
                "    private double refillRate;\n"
                "    private double tokens;\n"
                "    private double lastTimestamp;\n\n"
                "    public TokenBucket(double capacity, double refillRate) {\n"
                "        this.capacity = capacity;\n"
                "        this.refillRate = refillRate;\n"
                "        this.tokens = capacity;\n"
                "        this.lastTimestamp = 0.0;\n"
                "    }\n\n"
                "    public boolean allowRequest(double tokensNeeded, double currentTime) {\n"
                "        double elapsed = Math.max(0.0, currentTime - this.lastTimestamp);\n"
                "        this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);\n"
                "        this.lastTimestamp = currentTime;\n"
                "        if (this.tokens >= tokensNeeded) {\n"
                "            this.tokens -= tokensNeeded;\n"
                "            return true;\n"
                "        }\n"
                "        return false;\n"
                "    }\n"
                "}\n"
            ),
            "cpp": (
                "#include <algorithm>\n\n"
                "class TokenBucket {\n"
                "private:\n"
                "    double capacity;\n"
                "    double refillRate;\n"
                "    double tokens;\n"
                "    double lastTimestamp;\n"
                "public:\n"
                "    TokenBucket(double cap, double rate) : capacity(cap), refillRate(rate), tokens(cap), lastTimestamp(0.0) {}\n"
                "    bool allowRequest(double tokensNeeded, double currentTime) {\n"
                "        double elapsed = std::max(0.0, currentTime - lastTimestamp);\n"
                "        tokens = std::min(capacity, tokens + elapsed * refillRate);\n"
                "        lastTimestamp = currentTime;\n"
                "        if (tokens >= tokensNeeded) {\n"
                "            tokens -= tokensNeeded;\n"
                "            return true;\n"
                "        }\n"
                "        return false;\n"
                "    }\n"
                "};\n"
            )
        },
        "test_cases": [
            {
                "name": "Allow burst requests up to capacity",
                "input": "Bucket(capacity=5, rate=1), requests at t=0 for 3, 2, 1 tokens",
                "expected": "True, True, False (exhausted capacity)"
            },
            {
                "name": "Refill tokens over elapsed time",
                "input": "Bucket exhausted at t=0, request 2 tokens at t=2.0s with rate=1",
                "expected": "True (refilled 2 tokens)"
            },
            {
                "name": "Cap tokens strictly at maximum capacity",
                "input": "Bucket idle for 100s with capacity=5",
                "expected": "Tokens capped at 5.0"
            }
        ]
    }
]

# ─────────────────────────────────────────────────────────────────────────────
# 4. TROUBLESHOOTING & DEBUGGING CHALLENGES (Fix Real Buggy Code)
# ─────────────────────────────────────────────────────────────────────────────
TROUBLESHOOTING_CHALLENGES: List[Dict[str, Any]] = [
    {
        "id": "trouble-race-condition",
        "category": "troubleshooting",
        "title": "Fix Concurrency Race Condition in Shared State Store",
        "difficulty": "Mid-Level",
        "skills": ["debugging", "concurrency", "python", "javascript", "backend"],
        "bug_description": (
            "The following function processes a stream of concurrent user score increments. "
            "Under concurrent operations, the current implementation experiences lost updates because it "
            "reads a stale reference without proper atomic aggregation. "
            "Fix the bug so that all increments are accurately tallied without dropping concurrent updates."
        ),
        "broken_code": {
            "python": (
                "# BUGGY IMPLEMENTATION:\n"
                "# When multiple updates arrive, items get lost or overwritten.\n"
                "def tally_scores(records):\n"
                "    totals = {}\n"
                "    for item in records:\n"
                "        # BUG: Missing safe default and drops previous total\n"
                "        user = item.get('user')\n"
                "        pts = item.get('points', 0)\n"
                "        totals[user] = pts # <-- BUG: overwriting instead of accumulating!\n"
                "    return totals\n"
            ),
            "javascript": (
                "// BUGGY IMPLEMENTATION:\n"
                "// When multiple updates arrive, items get overwritten.\n"
                "function tallyScores(records) {\n"
                "  const totals = {};\n"
                "  for (const item of records) {\n"
                "    // BUG: overwrites existing score instead of summing\n"
                "    totals[item.user] = item.points;\n"
                "  }\n"
                "  return totals;\n"
                "}\n"
            ),
            "typescript": (
                "interface ScoreRecord { user: string; points: number; }\n\n"
                "function tallyScores(records: ScoreRecord[]): Record<string, number> {\n"
                "  const totals: Record<string, number> = {};\n"
                "  for (const item of records) {\n"
                "    // BUG: overwrites instead of accumulating\n"
                "    totals[item.user] = item.points;\n"
                "  }\n"
                "  return totals;\n"
                "}\n"
            ),
            "java": (
                "import java.util.*;\n\n"
                "public class Solution {\n"
                "    public static Map<String, Integer> tallyScores(List<Map<String, Object>> records) {\n"
                "        Map<String, Integer> totals = new HashMap<>();\n"
                "        for (Map<String, Object> item : records) {\n"
                "            String user = (String) item.get(\"user\");\n"
                "            int pts = (int) item.get(\"points\");\n"
                "            totals.put(user, pts); // BUG: Overwriting instead of sum!\n"
                "        }\n"
                "        return totals;\n"
                "    }\n"
                "}\n"
            ),
            "cpp": (
                "#include <string>\n"
                "#include <vector>\n"
                "#include <map>\n\n"
                "struct Record { std::string user; int points; };\n\n"
                "std::map<std::string, int> tallyScores(const std::vector<Record>& records) {\n"
                "    std::map<std::string, int> totals;\n"
                "    for (const auto& item : records) {\n"
                "        totals[item.user] = item.points; // BUG: Overwrites previous accumulation\n"
                "    }\n"
                "    return totals;\n"
                "}\n"
            )
        },
        "test_cases": [
            {
                "name": "Accumulate multiple score increments for the same candidate",
                "input": "[{user: 'Aarav', points: 10}, {user: 'Aarav', points: 25}]",
                "expected": "{'Aarav': 35}"
            },
            {
                "name": "Maintain independent totals across multiple distinct candidates",
                "input": "[{user: 'Aarav', points: 10}, {user: 'Priya', points: 40}, {user: 'Aarav', points: 5}]",
                "expected": "{'Aarav': 15, 'Priya': 40}"
            }
        ]
    },
    {
        "id": "trouble-sliding-window",
        "category": "troubleshooting",
        "title": "Fix Off-by-One Boundary Defect in Sliding Window Rate Limiter",
        "difficulty": "Mid-Level",
        "skills": ["debugging", "algorithms", "python", "javascript"],
        "bug_description": (
            "A sliding window filter is dropping events that occur exactly at the boundary limit of the window. "
            "Inspect the boundary comparison operator and fix the defect."
        ),
        "broken_code": {
            "python": (
                "# BUGGY IMPLEMENTATION:\n"
                "def is_within_window(current_ts, event_ts, window_size_ms=5000):\n"
                "    diff = current_ts - event_ts\n"
                "    # BUG: using '<' strictly drops events that occur exactly at boundary\n"
                "    return 0 < diff and diff < window_size_ms\n"
            ),
            "javascript": (
                "// BUGGY IMPLEMENTATION:\n"
                "function isWithinWindow(currentTs, eventTs, windowSizeMs = 5000) {\n"
                "  const diff = currentTs - eventTs;\n"
                "  // BUG: misses boundary at 0 and windowSizeMs\n"
                "  return diff > 0 && diff < windowSizeMs;\n"
                "}\n"
            ),
            "typescript": (
                "function isWithinWindow(currentTs: number, eventTs: number, windowSizeMs: number = 5000): boolean {\n"
                "  const diff = currentTs - eventTs;\n"
                "  return diff > 0 && diff < windowSizeMs;\n"
                "}\n"
            ),
            "java": (
                "public class Solution {\n"
                "    public static boolean isWithinWindow(long currentTs, long eventTs, long windowSizeMs) {\n"
                "        long diff = currentTs - eventTs;\n"
                "        return diff > 0 && diff < windowSizeMs;\n"
                "    }\n"
                "}\n"
            ),
            "cpp": (
                "bool isWithinWindow(long long currentTs, long long eventTs, long long windowSizeMs = 5000) {\n"
                "    long long diff = currentTs - eventTs;\n"
                "    return diff > 0 && diff < windowSizeMs;\n"
                "}\n"
            )
        },
        "test_cases": [
            {
                "name": "Include events with diff == 0 (simultaneous arrival)",
                "input": "current=5000, event=5000, window=5000",
                "expected": "True"
            },
            {
                "name": "Include events precisely on window boundary (diff == 5000)",
                "input": "current=10000, event=5000, window=5000",
                "expected": "True"
            },
            {
                "name": "Reject events outside window (diff == 5001)",
                "input": "current=10001, event=5000, window=5000",
                "expected": "False"
            }
        ]
    }
]

# ─────────────────────────────────────────────────────────────────────────────
# ASSESSMENT GENERATOR & RANDOMIZER
# ─────────────────────────────────────────────────────────────────────────────
def generate_job_assessment_bundle(job_skills: List[str], languages: List[str] = None, seed_candidate_id: str = None) -> Dict[str, Any]:
    """
    Selects a randomized 4-category assessment bundle based on the job's skills and allowed languages.
    Uses strict domain isolation so Cloud Engineers get Cloud/DevOps/Containers questions,
    Frontend Engineers get React/Web questions, and Backend Engineers get Systems/Database questions.
    """
    rng = random.Random(seed_candidate_id) if seed_candidate_id else random.Random()
    normalized_skills = [s.strip().lower() for s in (job_skills or [])]

    # Detect Job Technical Domain
    is_finance = any(k in s for s in normalized_skills for k in ["finance", "accounting", "tax", "audit", "taxation", "ifrs", "gaap", "controller", "cfo", "budget", "compliance"])
    is_cloud_infra = any(k in s for s in normalized_skills for k in ["aws", "cloud", "docker", "docket", "kubernetes", "k8s", "devops", "infra", "linux", "terraform", "platform", "sre", "networking"])
    is_frontend = any(k in s for s in normalized_skills for k in ["react", "frontend", "css", "html", "ui", "ux", "canvas", "web", "tailwind"])
    is_backend = any(k in s for s in normalized_skills for k in ["python", "backend", "fastapi", "django", "sql", "postgres", "concurrency", "distributed"])

    # 1. Technical MCQs: Strict Domain Filtering
    matching_mcqs = []
    for q in TECHNICAL_MCQS:
        q_skills = [qs.lower() for qs in q["skills"]]
        has_direct = any(s in q_skills or any(qs in s for qs in q_skills) for s in normalized_skills)
        if is_finance and (q.get("category") == "finance" or any(k in q_skills for k in ["finance", "accounting", "taxation", "auditing", "ifrs", "gaap", "tax audit"])):
            matching_mcqs.append(q)
        elif is_cloud_infra and any(k in q_skills for k in ["aws", "cloud", "docker", "docket", "kubernetes", "k8s", "devops", "networking"]):
            matching_mcqs.append(q)
        elif is_frontend and any(k in q_skills for k in ["react", "frontend", "javascript", "typescript", "performance"]):
            matching_mcqs.append(q)
        elif is_backend and not is_frontend and any(k in q_skills for k in ["python", "backend", "sql", "database", "concurrency", "system design"]):
            matching_mcqs.append(q)
        elif has_direct:
            matching_mcqs.append(q)

    # Deduplicate matching MCQs
    seen_ids = set()
    unique_matches = []
    for m in matching_mcqs:
        if m["id"] not in seen_ids:
            seen_ids.add(m["id"])
            unique_matches.append(m)

    # If fewer than 3, backfill from compatible domain pool only (NEVER cross incompatible domains)
    if len(unique_matches) < 3:
        if is_finance:
            fallback_pool = [q for q in TECHNICAL_MCQS if q.get("category") == "finance" or any(k in q["skills"] for k in ["finance", "accounting", "taxation", "auditing"])]
        elif is_cloud_infra:
            fallback_pool = [q for q in TECHNICAL_MCQS if any(k in q["skills"] for k in ["aws", "cloud", "docker", "kubernetes", "system design", "api", "devops"])]
        elif is_frontend:
            fallback_pool = [q for q in TECHNICAL_MCQS if any(k in q["skills"] for k in ["react", "frontend", "javascript", "typescript", "performance"])]
        else:
            fallback_pool = [q for q in TECHNICAL_MCQS if not any(k in q["skills"] for k in ["react", "frontend"])]
        
        for q in fallback_pool:
            if q["id"] not in seen_ids:
                seen_ids.add(q["id"])
                unique_matches.append(q)

    selected_mcqs = rng.sample(unique_matches, min(3, len(unique_matches)))

    # 2. Scenario Question: Domain-calibrated selection
    if is_finance:
        scenario_pool = [q for q in SCENARIO_QUESTIONS if any(k in q["skills"] for k in ["finance", "taxation", "tax audit", "accounting", "auditing", "compliance"])]
    elif is_cloud_infra:
        scenario_pool = [q for q in SCENARIO_QUESTIONS if any(k in q["skills"] for k in ["aws", "cloud", "kubernetes", "k8s", "docker", "devops"])]
    elif is_frontend:
        scenario_pool = [q for q in SCENARIO_QUESTIONS if any(k in q["skills"] for k in ["react", "frontend", "webrtc", "javascript"])]
    else:
        scenario_pool = [q for q in SCENARIO_QUESTIONS if any(k in q["skills"] for k in ["backend", "database", "system design", "cloud"])]
    
    selected_scenario = rng.choice(scenario_pool if scenario_pool else SCENARIO_QUESTIONS)

    # 3. Hands-on Coding: Pick 1 challenge
    selected_hands_on = rng.choice(HANDS_ON_CHALLENGES)

    # 4. Troubleshooting: Pick 1 bug fix
    selected_trouble = rng.choice(TROUBLESHOOTING_CHALLENGES)

    # Programming Languages: Filter out spoken languages (e.g. English, Hindi) and default to all 5 technical languages
    all_supported_langs = ["python", "javascript", "typescript", "java", "cpp"]
    if languages:
        valid_prog_langs = [l.lower() for l in languages if l.lower() in all_supported_langs]
        allowed_langs = valid_prog_langs if valid_prog_langs else all_supported_langs
    else:
        allowed_langs = all_supported_langs

    supported_langs = [l for l in selected_hands_on["supported_languages"] if l in allowed_langs] or all_supported_langs

    return {
        "technical_mcqs": [
            {
                "id": q["id"],
                "question": q["question"],
                "options": q["options"],
                "difficulty": q["difficulty"]
            }
            for q in selected_mcqs
        ],
        "scenario": {
            "id": selected_scenario["id"],
            "title": selected_scenario["title"],
            "prompt": selected_scenario["prompt"],
            "guidance": selected_scenario["guidance"],
            "difficulty": selected_scenario["difficulty"]
        },
        "hands_on": {
            "id": selected_hands_on["id"],
            "title": selected_hands_on["title"],
            "instructions": selected_hands_on["instructions"],
            "difficulty": selected_hands_on["difficulty"],
            "supported_languages": supported_langs,
            "starter_code": selected_hands_on["starter_code"],
            "test_cases": selected_hands_on["test_cases"]
        },
        "troubleshooting": {
            "id": selected_trouble["id"],
            "title": selected_trouble["title"],
            "bug_description": selected_trouble["bug_description"],
            "difficulty": selected_trouble["difficulty"],
            "broken_code": selected_trouble["broken_code"],
            "test_cases": selected_trouble["test_cases"]
        }
    }
