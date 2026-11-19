(function () {
  SAA.addModule({
    id: "m04", num: 4, title: "Compute: EC2, Auto Scaling, load balancers", sub: "Servers that heal, grow and share the load",
    lessons: [
      {
        id: "ec2-basics", title: "EC2: instances, AMIs, instance types", min: 4,
        tryFirst: {
          type: "mcq",
          q: `A team will run an in-memory analytics engine that needs about 400 GiB of RAM but only moderate CPU. Which kind of EC2 instance fits best?`,
          options: [
            { t: `A memory optimized instance (R or X family)`, ok: true, why: `R and X instances have a high ratio of memory to vCPU, built for in-memory databases, caches and analytics.` },
            { t: `A compute optimized instance (C family)`, ok: false, why: `C instances have lots of CPU per GiB of memory. You'd pay for CPU you don't need to get 400 GiB.` },
            { t: `A burstable instance (T family)`, ok: false, why: `T instances are small and built for low average CPU; none come close to 400 GiB.` },
            { t: `A storage optimized instance (I family)`, ok: false, why: `I instances are built around fast local NVMe disks, not around memory.` },
          ],
        },
        body: `<p><strong>EC2</strong> (Elastic Compute Cloud) gives you virtual servers called <strong>instances</strong>. You pick three things when you launch one:</p>
<ul><li><strong>AMI</strong> (Amazon Machine Image): the template with the operating system and any software already installed. AMIs belong to one Region; copy them to use them in another.</li>
<li><strong>Instance type</strong>: the size and shape, like <code>m7g.large</code>. The letter is the <em>family</em>, the number the generation, the letters after it extras (<code>g</code> = AWS Graviton ARM processor), and the word after the dot the size.</li>
<li><strong>Networking and storage</strong>: which subnet (so which AZ), security groups, and disks.</li></ul>
<div class="tablewrap"><table><thead><tr><th>Family</th><th>Built for</th><th>Typical use</th></tr></thead><tbody>
<tr><td><strong>T</strong> burstable</td><td>Low average CPU, short bursts (CPU credits)</td><td>Small websites, dev boxes</td></tr>
<tr><td><strong>M</strong> general purpose</td><td>Balanced CPU and memory</td><td>App servers, most things</td></tr>
<tr><td><strong>C</strong> compute optimized</td><td>Lots of CPU</td><td>Batch, video encoding, game servers, HPC</td></tr>
<tr><td><strong>R / X</strong> memory optimized</td><td>Lots of RAM</td><td>In-memory databases and caches</td></tr>
<tr><td><strong>I / D</strong> storage optimized</td><td>Fast or large local disks</td><td>NoSQL databases, data warehouses</td></tr>
<tr><td><strong>P / G / Inf / Trn</strong> accelerated</td><td>GPUs or ML chips</td><td>Machine learning, graphics</td></tr></tbody></table></div>
<p><strong>User data</strong> is a script that runs on the first boot, handy for installing or configuring things. If that takes long, bake the software into your own <strong>golden AMI</strong> instead so new instances are ready in a minute or two. <strong>EC2 Image Builder</strong> automates building, testing and copying AMIs to other Regions.</p>
<p><strong>Graviton</strong> instances (<code>g</code> in the name) usually give the best price-performance for Linux workloads that can run on ARM.</p>`,
        example: `<p>A web app needs 12 minutes of package installs in user data before it can serve. During a traffic spike, new instances arrive too late. Building a golden AMI with everything preinstalled cuts that to about a minute, and user data only does small things like reading config.</p>`,
        concepts: [
          {
            id: "instance-families", title: "Choosing an instance family", domain: "performance",
            variants: [
              {
                type: "mcq", level: 1,
                q: `Which instance family is designed for workloads that need a lot of CPU compared to memory, like video encoding?`,
                options: [
                  { t: `C (compute optimized)`, ok: true, why: `C instances give the most CPU per GiB of memory.` },
                  { t: `R (memory optimized, for in-memory data)`, ok: false, why: `R is the opposite: lots of memory per vCPU.` },
                  { t: `T (burstable)`, ok: false, why: `T instances can only burst for a while on credits; a constant encoding load drains them.` },
                  { t: `I (storage optimized)`, ok: false, why: `I instances are about fast local disks.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A small marketing website averages 5% CPU, with short spikes when a newsletter goes out. Which instance family is usually the cheapest good fit?`,
                options: [
                  { t: `T (burstable)`, ok: true, why: `T instances earn CPU credits while idle and spend them on spikes. Low average CPU with short bursts is exactly their use case.` },
                  { t: `C (compute optimized)`, ok: false, why: `You'd pay for lots of CPU that sits unused 95% of the time.` },
                  { t: `M (general purpose)`, ok: false, why: `It works, but you pay for steady full CPU that this site doesn't need.` },
                  { t: `P (GPU)`, ok: false, why: `GPUs are for ML and graphics; very expensive for a website.` },
                ],
              },
              {
                type: "multi", level: 3,
                q: `A media company is moving two workloads to Amazon EC2. The first is a video transcoding fleet that keeps every vCPU at close to 100% for hours at a time. The second is a self-managed in-memory cache that needs about 500 GiB of RAM per node but uses little CPU. The company wants the best performance for each workload at the lowest cost. Which instance choices meet these requirements? (Choose two.)`,
                options: [
                  { t: `Run the transcoding fleet on compute optimized C-family instances.`, ok: true, why: `Sustained, CPU-bound work is what C instances are built for.` },
                  { t: `Run the cache nodes on memory optimized R- or X-family instances.`, ok: true, why: `High memory per vCPU means you get 500 GiB without paying for unneeded CPU.` },
                  { t: `Run the transcoding fleet on burstable T-family instances in unlimited mode.`, ok: false, why: `At constant 100% CPU, unlimited mode bills surplus credits all the time; it ends up costlier than a C instance.` },
                  { t: `Run the cache nodes on storage optimized I-family instances.`, ok: false, why: `I instances pay for fast local NVMe disks. A cache that lives in RAM needs memory, not disks.` },
                  { t: `Run both workloads on general purpose M-family instances of the largest size.`, ok: false, why: `Balanced instances overpay for memory in the transcoder and for CPU in the cache.` },
                ],
              },
              {
                type: "mcq", level: 3,
                q: `A company runs a Java web service on 40 x86-based general purpose EC2 instances running Amazon Linux. Load testing showed the service runs correctly on ARM processors. The finance team asks the architects to lower the compute bill without reducing performance or making long-term commitments. Which solution meets these requirements MOST cost-effectively?`,
                options: [
                  { t: `Move the service to the equivalent Graviton-based instances, such as M7g.`, ok: true, why: `Graviton gives better price-performance than comparable x86 instances, and the app already runs on ARM. No commitment needed.` },
                  { t: `Move the service to compute optimized x86 instances of the next larger size.`, ok: false, why: `Larger instances cost more, and the service isn't CPU-bound.` },
                  { t: `Move the instances to Dedicated Hosts so the company controls placement on the hardware.`, ok: false, why: `Dedicated Hosts cost more; they're for licensing and compliance, not savings.` },
                  { t: `Buy 3-year Reserved Instances for the current x86 instance type.`, ok: false, why: `It saves money, but it's the long-term commitment the team wants to avoid, and it locks in the older, pricier type.` },
                ],
              },
            ],
          },
          {
            id: "ami-userdata", title: "AMIs, golden images and user data", domain: "resilient",
            variants: [
              {
                type: "mcq", level: 1,
                q: `What is an AMI?`,
                options: [
                  { t: `A template with an OS and software that new instances are launched from`, ok: true, why: `Every instance starts from an AMI. Your own AMIs can include your app already installed.` },
                  { t: `A backup of an S3 bucket`, ok: false, why: `AMIs are for instances; S3 has its own features.` },
                  { t: `The bill for one instance-hour`, ok: false, why: `Nothing to do with billing.` },
                  { t: `A network setting that gives an instance a public IP`, ok: false, why: `Public IPs come from subnet settings or Elastic IPs.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `New instances in an Auto Scaling group spend 20 minutes installing packages from their user data script before they can take traffic. Scale-outs arrive too late for traffic spikes. What's the best fix?`,
                options: [
                  { t: `Build a golden AMI with the packages preinstalled`, ok: true, why: `The slow work happens once, when the image is built. New instances boot ready to serve.` },
                  { t: `Use a larger instance type so the script runs faster`, ok: false, why: `Downloads and installs barely speed up, and every instance now costs more.` },
                  { t: `Split the script into two user data scripts`, ok: false, why: `Same work, same time.` },
                  { t: `Launch the group in more Availability Zones`, ok: false, why: `More AZs help resilience, not boot time.` },
                ],
              },
              {
                type: "fill", level: 2,
                q: `AMIs belong to one Region. To launch the same image in another Region, you ___ the AMI to that Region. (one word)`,
                accept: ["copy", "copied", "copying"], placeholder: "one word",
                why: `You copy the AMI (and its snapshots) to the other Region. EC2 Image Builder can do it automatically for every new version.`,
              },
              {
                type: "mcq", level: 3,
                q: `A company builds a hardened AMI for its application every two weeks by hand in eu-west-1. For disaster recovery, the company must be able to launch the latest image in eu-central-1 at any time. The security team also wants every new image tested before use. The operations team is small. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
                options: [
                  { t: `Build, test and distribute the image to both Regions with an EC2 Image Builder pipeline.`, ok: true, why: `Image Builder automates build, test and cross-Region distribution in one managed pipeline.` },
                  { t: `Keep building by hand and run a script every two weeks that copies the newest AMI to eu-central-1.`, ok: false, why: `Works, but the build and tests stay manual and the script is something else to maintain.` },
                  { t: `Take EBS snapshots of a running instance every night and copy the snapshots to eu-central-1.`, ok: false, why: `Snapshots of a running server aren't a tested image, and you'd still need to build AMIs from them in a hurry.` },
                  { t: `Rebuild the instance in eu-central-1 from the install guide when a disaster happens.`, ok: false, why: `Slow, error-prone and untested right when you need it most.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `How would you choose between T, M, C and R instances for a workload? And why would you bake a golden AMI instead of installing everything in user data?`,
          points: [
            `T: low average CPU with bursts; M: balanced; C: CPU-heavy; R/X: memory-heavy`,
            `Match the family to the bottleneck so you don't pay for unused CPU or memory`,
            `Golden AMI: slow installs happen once at build time, so new instances are ready fast (important for scaling)`,
            `AMIs are per Region; copy them (or use Image Builder) for other Regions`,
          ],
        },
      },

      {
        id: "purchase-options", title: "Paying for EC2: On-Demand, Savings Plans, Spot", min: 4,
        tryFirst: {
          type: "mcq",
          q: `A nightly batch job processes images. If it's interrupted, it just picks up the unfinished images on the next run. What's the cheapest way to pay for its instances?`,
          options: [
            { t: `Spot Instances`, ok: true, why: `Spot uses spare AWS capacity at up to 90% off. It can be taken back with 2 minutes' warning, which this job tolerates.` },
            { t: `On-Demand Instances`, ok: false, why: `Works, but you pay full price for a job that doesn't need guaranteed capacity.` },
            { t: `A 3-year Reserved Instance`, ok: false, why: `You'd pay for 24 hours a day for a job that runs a few hours a night.` },
            { t: `Dedicated Hosts`, ok: false, why: `The most expensive option; for licensing or compliance, not savings.` },
          ],
        },
        body: `<div class="tablewrap"><table><thead><tr><th>Option</th><th>Discount</th><th>Use it for</th></tr></thead><tbody>
<tr><td><strong>On-Demand</strong></td><td>none, pay per second</td><td>Short, spiky or unpredictable work; anything you're unsure about</td></tr>
<tr><td><strong>Savings Plans</strong></td><td>up to ~72%</td><td>Steady use: you commit to $X per hour for 1 or 3 years</td></tr>
<tr><td><strong>Reserved Instances</strong></td><td>up to ~72%</td><td>Same idea, older model: commit to a specific instance type in a Region</td></tr>
<tr><td><strong>Spot</strong></td><td>up to ~90%</td><td>Work that can be interrupted: batch, CI, rendering, stateless workers</td></tr>
<tr><td><strong>Dedicated Hosts</strong></td><td>costs more</td><td>Licences counted per physical socket or core; compliance</td></tr></tbody></table></div>
<p><strong>Savings Plans</strong> come in two kinds. A <strong>Compute Savings Plan</strong> applies to any instance family, size, Region and OS, and to Fargate and Lambda too. An <strong>EC2 Instance Savings Plan</strong> gives a bigger discount but is tied to one family in one Region. Commitments give a discount, <em>not</em> guaranteed capacity.</p>
<p>For guaranteed capacity, use an <strong>On-Demand Capacity Reservation</strong>: capacity held in one specific AZ, with no term, billed whether you use it or not. Combine it with a Savings Plan to get the discount too.</p>
<p><strong>Spot</strong> instances can be reclaimed with a <strong>2-minute warning</strong>. To make Spot reliable, spread over many instance types and AZs (an Auto Scaling group with a <em>mixed instances policy</em> and the <em>price-capacity-optimized</em> strategy), and keep a small On-Demand base for what must always run.</p>
<p><strong>Dedicated Instances</strong> run on hardware no other customer uses. <strong>Dedicated Hosts</strong> go further: you get a whole physical server and see its sockets and cores, which some software licences (bring your own licence) require.</p>`,
        example: `<p>A shop runs 10 web servers around the clock and up to 40 rendering workers each night. A Compute Savings Plan covers the 10 always-on servers; the rendering workers run on Spot across several instance types. Nothing is paid full price except short surprises, which On-Demand absorbs.</p>`,
        concepts: [
          {
            id: "commit-discounts", title: "Savings Plans, Reserved Instances, Capacity Reservations", domain: "cost",
            variants: [
              {
                type: "mcq", level: 1,
                q: `A database server will run 24/7 for at least the next 3 years. Which pricing gives the biggest saving while keeping it uninterrupted?`,
                options: [
                  { t: `A 3-year Savings Plan or Reserved Instance`, ok: true, why: `Steady, predictable, long-running use is exactly what commitments discount.` },
                  { t: `Spot Instances`, ok: false, why: `Cheaper per hour, but they can be interrupted: not for a database that must stay up.` },
                  { t: `On-Demand`, ok: false, why: `No interruptions, but full price for 3 years.` },
                  { t: `Dedicated Hosts`, ok: false, why: `Costs more, not less.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A company's compute use is steady overall, but it often changes instance families and Regions, and is moving some services to Fargate and Lambda. Which commitment fits?`,
                options: [
                  { t: `Compute Savings Plan`, ok: true, why: `It applies across families, sizes, Regions, OS, Fargate and Lambda, so the changes don't waste the commitment.` },
                  { t: `EC2 Instance Savings Plan`, ok: false, why: `Tied to one family in one Region. Every move outside it loses the discount.` },
                  { t: `Standard Reserved Instances`, ok: false, why: `Tied to an instance type and Region, and they don't cover Fargate or Lambda.` },
                  { t: `Spot Instances`, ok: false, why: `Not a commitment, and not for steady work that must not be interrupted.` },
                ],
              },
              {
                type: "multi", level: 3,
                q: `A company runs 12 application servers on EC2 around the clock, and the number hasn't changed in a year. Every night it also runs a reporting job on up to 30 instances for about 3 hours. The job saves its progress often and can resume if instances disappear. The company wants to reduce EC2 costs as much as possible. Which actions meet these requirements? (Choose two.)`,
                options: [
                  { t: `Cover the 12 application servers with a Savings Plan.`, ok: true, why: `Steady 24/7 use is what Savings Plans discount most.` },
                  { t: `Run the nightly reporting instances as Spot Instances.`, ok: true, why: `Interruptible, resumable batch work at up to 90% off.` },
                  { t: `Buy 3-year Reserved Instances for the 30 reporting instances.`, ok: false, why: `You'd pay for 24 hours a day to use 3 of them.` },
                  { t: `Move the application servers to Spot Instances.`, ok: false, why: `Steady production servers that must stay up shouldn't depend on capacity that can be reclaimed.` },
                  { t: `Move all instances to Dedicated Instances.`, ok: false, why: `Dedicated Instances cost more; nothing here requires them.` },
                ],
              },
              {
                type: "mcq", level: 3,
                q: `A ticketing company expects a huge sale next month that will need 200 instances of a specific type in one Availability Zone for exactly one week. Past launches during busy periods have failed with insufficient capacity errors. The company doesn't want any commitment longer than the event. Which solution meets these requirements?`,
                options: [
                  { t: `Create an On-Demand Capacity Reservation in that AZ for the week.`, ok: true, why: `It holds the capacity in that AZ with no term; cancel it when the sale ends.` },
                  { t: `Buy a 1-year zonal Reserved Instance for 200 instances in that AZ.`, ok: false, why: `It does reserve capacity, but it's a 1-year commitment for a 1-week need.` },
                  { t: `Buy a 1-year Compute Savings Plan that covers 200 instances.`, ok: false, why: `A discount only: no capacity is held, and it's a 1-year commitment.` },
                  { t: `Request 200 Spot Instances of that type in the AZ.`, ok: false, why: `Spot capacity is the first to vanish when capacity is tight, and can be reclaimed mid-sale.` },
                ],
              },
            ],
          },
          {
            id: "spot", title: "Spot Instances and dedicated hardware", domain: "cost",
            variants: [
              {
                type: "mcq", level: 1,
                q: `What happens when AWS needs a Spot Instance's capacity back?`,
                options: [
                  { t: `It gets a 2-minute warning, then is stopped or terminated`, ok: true, why: `That's the trade-off for the large discount. Design Spot workloads to handle it.` },
                  { t: `The price you pay doubles until you release it`, ok: false, why: `Spot prices change slowly with demand; reclaiming is an interruption, not a surcharge.` },
                  { t: `Nothing; Spot Instances can't be interrupted after launch`, ok: false, why: `They can be interrupted at any time.` },
                  { t: `AWS moves it to On-Demand pricing automatically`, ok: false, why: `It's interrupted, not converted.` },
                ],
              },
              {
                type: "multi", level: 2,
                q: `Which workloads are good fits for Spot Instances? (Choose two.)`,
                options: [
                  { t: `CI build agents that retry failed builds`, ok: true, why: `Stateless and retryable.` },
                  { t: `Frame-by-frame video rendering from a job queue`, ok: true, why: `Each frame is a small job that can simply be redone.` },
                  { t: `The only instance running a production database`, ok: false, why: `An interruption takes the database down.` },
                  { t: `A legacy server that keeps important state on its own disk`, ok: false, why: `Interruption risks the state and the service.` },
                  { t: `A licence server that must always be reachable`, ok: false, why: `Must always be up: not Spot.` },
                ],
              },
              {
                type: "mcq", level: 3,
                q: `A company runs a stateless web API on an Auto Scaling group behind an Application Load Balancer. Traffic varies during the day. At least 4 instances must always be running to serve the minimum load reliably. The company wants to cut costs as much as possible while keeping the API available if some Spot capacity is reclaimed. Which solution meets these requirements MOST cost-effectively?`,
                options: [
                  { t: `Use a mixed instances policy with an On-Demand base of 4 and Spot above that, across several instance types and AZs with the price-capacity-optimized strategy.`, ok: true, why: `The base 4 are never interrupted; everything above uses cheap Spot, and many types and AZs make interruptions rare and small.` },
                  { t: `Run all instances as Spot using a single instance type to keep the fleet uniform.`, ok: false, why: `One type in one pool means one capacity crunch can take out the whole fleet, including the minimum 4.` },
                  { t: `Run all instances On-Demand and buy Spot only during the nightly low-traffic period.`, ok: false, why: `Pays full price for the daytime peak, where Spot would save the most.` },
                  { t: `Run all instances as Spot in a single AZ with the lowest current Spot price.`, ok: false, why: `One AZ and the lowest-price pool give the highest interruption risk and no AZ resilience.` },
                ],
              },
              {
                type: "elim", level: 2,
                q: `A company is moving database software whose licence is counted per physical CPU core of the server it runs on.`,
                reqs: [`The licence is counted per physical core`, `No other AWS customer may share the hardware`],
                options: [
                  { t: `Dedicated Hosts`, ok: true, why: `A whole physical server for you, with its sockets and cores visible for licensing.` },
                  { t: `Dedicated Instances`, ok: false, kills: [0], why: `Hardware isn't shared, but you can't see or control the physical cores.` },
                  { t: `On-Demand Instances on shared hardware`, ok: false, kills: [0, 1], why: `Shared hardware and no view of physical cores.` },
                  { t: `Spot Instances`, ok: false, kills: [0, 1], why: `Shared hardware, no core visibility, and interruptible.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `A company has steady 24/7 servers, a nightly interruptible batch job, and a one-week event that needs guaranteed capacity. What would you buy for each, and why?`,
          points: [
            `Steady 24/7: Savings Plan (Compute for flexibility, EC2 Instance for the biggest discount) or Reserved Instances`,
            `Interruptible batch: Spot, up to 90% off, 2-minute warning`,
            `Guaranteed capacity with no term: On-Demand Capacity Reservation in that AZ`,
            `Commitments give a discount, not capacity`,
          ],
        },
      },

      {
        id: "placement-networking", title: "Placement groups, IPs and network interfaces", min: 4,
        tryFirst: {
          type: "mcq",
          q: `A weather simulation runs on 16 instances that constantly exchange data. Network latency between them is the bottleneck. How should the instances be placed?`,
          options: [
            { t: `In a cluster placement group in one AZ`, ok: true, why: `A cluster placement group packs instances close together in one AZ for the lowest latency and highest throughput between them.` },
            { t: `Spread across three AZs`, ok: false, why: `Better for resilience, but every message between AZs adds latency.` },
            { t: `In a spread placement group`, ok: false, why: `Spread puts each instance on different hardware, the opposite of close together.` },
            { t: `In three different Regions`, ok: false, why: `Far worse latency.` },
          ],
        },
        body: `<p>Normally AWS decides where in an AZ your instances run. A <strong>placement group</strong> lets you steer that:</p>
<div class="tablewrap"><table><thead><tr><th>Type</th><th>What it does</th><th>Use it for</th></tr></thead><tbody>
<tr><td><strong>Cluster</strong></td><td>Packs instances close together in <em>one AZ</em></td><td>HPC, tightly coupled jobs needing the lowest latency. Risk: one rack problem can hit many.</td></tr>
<tr><td><strong>Spread</strong></td><td>Every instance on different hardware (racks); <strong>max 7 running instances per AZ</strong> per group</td><td>A few critical instances that must not fail together</td></tr>
<tr><td><strong>Partition</strong></td><td>Groups of instances (partitions) on separate racks; up to 7 partitions per AZ, many instances each</td><td>Big distributed systems that know about racks: Hadoop, Cassandra, Kafka</td></tr></tbody></table></div>
<p><strong>IP addresses.</strong> An instance's private IP stays for its whole life. An auto-assigned public IPv4 <em>changes</em> when you stop and start the instance. An <strong>Elastic IP</strong> is a static public IPv4 you keep until you release it, and you can move it to another instance. Every public IPv4 address, Elastic or not, is billed by the hour.</p>
<p><strong>Network interfaces (ENIs).</strong> An instance's network card is an ENI with its private IP(s), MAC address and security groups. You can add a <em>secondary</em> ENI and move it to another instance in the same AZ; its IPs and MAC address move with it. Some old licences are tied to a MAC address, and moving the ENI is how you fail over.</p>
<p>For HPC, an <strong>Elastic Fabric Adapter</strong> (EFA) is a network interface that lets instances talk with very low latency, used together with cluster placement groups.</p>`,
        example: `<p>A Kafka cluster with 3 brokers per partition: a partition placement group with 3 partitions puts each broker set on separate racks, so one rack failure can't take out every copy of the data.</p>`,
        concepts: [
          {
            id: "placement-groups", title: "Cluster, spread and partition placement groups", domain: "performance",
            variants: [
              {
                type: "mcq", level: 1,
                q: `Which placement group puts instances close together in a single AZ for the lowest network latency?`,
                options: [
                  { t: `Cluster`, ok: true, why: `Close together in one AZ: lowest latency, highest throughput between instances.` },
                  { t: `Spread`, ok: false, why: `Spread keeps instances apart on different hardware.` },
                  { t: `Partition`, ok: false, why: `Partition separates groups of instances onto different racks.` },
                  { t: `Regional`, ok: false, why: `There's no such placement group.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A 30-node Apache Cassandra cluster must keep the copies of each piece of data on separate racks, and the database needs to know which rack each node is on. Which placement group fits?`,
                options: [
                  { t: `Partition`, ok: true, why: `Partitions are separate racks with many instances each, and instances can see their partition number, so Cassandra can place replicas rack-aware.` },
                  { t: `Spread`, ok: false, why: `Spread allows only 7 running instances per AZ per group, too few for 30 nodes, and doesn't expose rack groups.` },
                  { t: `Cluster`, ok: false, why: `Cluster packs nodes together; one rack problem could hit many replicas.` },
                  { t: `No placement group, just more AZs`, ok: false, why: `AZs help, but don't give rack-level separation inside an AZ.` },
                ],
              },
              {
                type: "fill", level: 2,
                q: `How many running instances per AZ can a spread placement group hold?`,
                accept: ["7", "seven"], placeholder: "a number",
                why: `Seven per AZ per group. For more, use several spread groups or a partition placement group.`,
              },
              {
                type: "mcq", level: 3,
                q: `A company runs a small but critical quorum service on 6 EC2 instances across two Availability Zones in one Region. An audit found that 3 of the instances were running on the same underlying hardware and could fail together. The company wants to lower the chance that a single hardware failure takes out more than one instance, without changing the application. Which solution meets these requirements MOST cost-effectively?`,
                options: [
                  { t: `Launch the instances in a spread placement group that covers both AZs.`, ok: true, why: `Spread puts every instance on distinct hardware; 3 per AZ is well under the limit of 7, and it costs nothing extra.` },
                  { t: `Launch the instances in a cluster placement group in one AZ.`, ok: false, why: `Cluster packs instances together, raising the chance they fail together, and gives up the second AZ.` },
                  { t: `Move each instance to its own Dedicated Host.`, ok: false, why: `It separates them, but paying for 6 whole servers is far more expensive than a free placement group.` },
                  { t: `Launch the instances in a partition placement group with one partition per AZ.`, ok: false, why: `Instances in the same partition can share a rack, so the 3 instances in each AZ could still fail together.` },
                ],
              },
            ],
          },
          {
            id: "ips-enis", title: "Elastic IPs and network interfaces", domain: "resilient",
            variants: [
              {
                type: "mcq", level: 1,
                q: `An instance has an auto-assigned public IPv4 address. What happens to it when you stop and start the instance?`,
                options: [
                  { t: `It usually gets a different public IP`, ok: true, why: `Auto-assigned public IPs are released on stop. Use an Elastic IP if the address must stay the same.` },
                  { t: `It keeps the same public IP forever`, ok: false, why: `Only an Elastic IP is kept across stop and start.` },
                  { t: `It loses its private IP too`, ok: false, why: `The private IP stays for the instance's whole life.` },
                  { t: `It can't be started again without a new subnet`, ok: false, why: `Stop and start work normally.` },
                ],
              },
              {
                type: "multi", level: 2,
                q: `Which statements about Elastic IP addresses are true? (Choose two.)`,
                options: [
                  { t: `It's a static public IPv4 address that stays yours until you release it`, ok: true, why: `That's the point of an Elastic IP.` },
                  { t: `It can be moved to another instance to hide an instance failure`, ok: true, why: `Remapping it sends traffic for that address to the new instance.` },
                  { t: `It's free as long as it's attached to a running instance`, ok: false, why: `Every public IPv4 address is billed by the hour, attached or not.` },
                  { t: `It can be used in any Region`, ok: false, why: `Elastic IPs belong to one Region.` },
                  { t: `It's attached to a subnet rather than to an instance or interface`, ok: false, why: `It's associated with an instance or a network interface.` },
                ],
              },
              {
                type: "multi", level: 3,
                q: `A company runs a legacy licensing server on a single EC2 instance. The software's licence is bound to the MAC address of the network card, and dozens of clients connect to it using one public IPv4 address that is hard-coded in their configuration. The company keeps a stopped standby instance in the same Availability Zone. Which steps let the company fail over to the standby with the LEAST disruption to clients and licensing? (Choose two.)`,
                options: [
                  { t: `Run the licence server on a secondary network interface and move that interface to the standby when failing over.`, ok: true, why: `The interface's MAC address and private IPs move with it, so the licence stays valid.` },
                  { t: `Associate an Elastic IP address with that secondary network interface.`, ok: true, why: `The public IP follows the interface to the standby, so clients keep using the same address.` },
                  { t: `Create an AMI of the server and launch a new instance from it during failover.`, ok: false, why: `A new instance gets a new network interface with a new MAC address, which breaks the licence.` },
                  { t: `Rely on the instance's auto-assigned public IP and update clients after failover.`, ok: false, why: `The address changes, and dozens of clients would need reconfiguring every time.` },
                  { t: `Put both instances in a spread placement group.`, ok: false, why: `It reduces shared-hardware risk, but does nothing to keep the MAC or the IP.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A partner will only accept calls from IP addresses on its allowlist. Your app sends those calls from instances in private subnets. How do you give the partner a fixed address to allow?`,
                options: [
                  { t: `Route the calls through a NAT gateway and give the partner its Elastic IP`, ok: true, why: `All outbound traffic from the private subnets leaves through the NAT gateway's fixed Elastic IP.` },
                  { t: `Give each private instance an auto-assigned public IP`, ok: false, why: `Instances in private subnets don't use public IPs to reach the internet, and auto-assigned ones change anyway.` },
                  { t: `Give the partner the instances' private IP addresses`, ok: false, why: `Private IPs aren't reachable or visible on the internet.` },
                  { t: `Put the instances in a cluster placement group`, ok: false, why: `Placement doesn't affect which IP traffic leaves from.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `When would you use a cluster, a spread and a partition placement group? And what's the difference between an auto-assigned public IP and an Elastic IP?`,
          points: [
            `Cluster: one AZ, packed together, lowest latency (HPC), but correlated failure risk`,
            `Spread: each instance on different hardware, max 7 per AZ, for a few critical instances`,
            `Partition: separate racks for groups of instances, for big rack-aware systems like Cassandra, Kafka, Hadoop`,
            `Auto-assigned public IP changes on stop/start; an Elastic IP is static, movable, and billed`,
          ],
        },
      },

      {
        id: "asg-basics", title: "Auto Scaling groups", min: 4,
        tryFirst: {
          type: "mcq",
          q: `A small app runs on one EC2 instance. It can only run as a single copy. Last month the instance failed at 3 AM and the app was down until someone noticed at 9 AM. What's the simplest way to have it replaced automatically?`,
          options: [
            { t: `An Auto Scaling group with minimum, maximum and desired capacity all set to 1`, ok: true, why: `The group keeps exactly one instance running and replaces it when it fails, with no extra instances.` },
            { t: `A second instance running the app at the same time`, ok: false, why: `The app can only run as a single copy.` },
            { t: `A larger instance type`, ok: false, why: `Bigger instances still fail.` },
            { t: `A daily snapshot of the instance's disk`, ok: false, why: `Helps you rebuild, but someone still has to notice and do it.` },
          ],
        },
        body: `<p>An <strong>Auto Scaling group</strong> (ASG) keeps a fleet of EC2 instances at the right size and replaces broken ones. You give it:</p>
<ul><li>A <strong>launch template</strong>: what to launch (AMI, instance type, security groups, user data). Launch templates replaced the older launch configurations, and only templates support mixed instance types and Spot.</li>
<li><strong>Subnets</strong>, ideally in two or more AZs. The group spreads instances evenly across them and, if an AZ fails, launches replacements in the others.</li>
<li><strong>Minimum</strong>, <strong>maximum</strong> and <strong>desired</strong> capacity. Desired is what it aims for right now; scaling policies (next lesson) move it between min and max.</li></ul>
<p><strong>Health checks.</strong> By default the group only uses EC2 status checks: is the virtual machine itself OK? An app can hang while the VM looks fine. Turn on <strong>ELB health checks</strong> and the group also replaces instances the load balancer reports as unhealthy. Give new instances a <strong>health check grace period</strong> so they aren't judged before they've finished booting.</p>
<p>Extras worth knowing:</p>
<ul><li><strong>Lifecycle hooks</strong> pause an instance while launching or terminating so a script can run (install something, or copy logs off before it's gone).</li>
<li><strong>Warm pools</strong> keep pre-initialized instances stopped and ready, so scale-out takes seconds instead of a long boot.</li>
<li><strong>Instance refresh</strong> replaces instances in batches to roll out a new launch template version.</li></ul>`,
        example: `<p>A web tier needs 4 instances. With subnets in AZs a and b, the group runs 2 in each. If AZ a fails, the group launches 2 more in AZ b to get back to 4. The app never needs to know.</p>`,
        concepts: [
          {
            id: "asg-capacity", title: "Desired capacity, AZs and self-healing", domain: "resilient",
            variants: [
              {
                type: "mcq", level: 1,
                q: `An Auto Scaling group has min 2, desired 4, max 10. One instance fails its health check. What does the group do?`,
                options: [
                  { t: `Replaces it to get back to 4 instances`, ok: true, why: `The group always works back to the desired capacity.` },
                  { t: `Nothing, because 3 is still above the minimum of 2`, ok: false, why: `The group aims for desired, not just the minimum.` },
                  { t: `Launches 6 more to reach the maximum`, ok: false, why: `Max is a ceiling, not a target.` },
                  { t: `Reboots the failed instance until it passes`, ok: false, why: `It terminates unhealthy instances and launches new ones.` },
                ],
              },
              {
                type: "order", level: 2,
                q: `An Auto Scaling group uses ELB health checks. Put in order what happens when an instance's app stops responding.`,
                steps: [
                  `The load balancer's health checks fail and it marks the target unhealthy`,
                  `The Auto Scaling group marks the instance unhealthy`,
                  `The group terminates the instance`,
                  `The group launches a new instance from the launch template`,
                  `The new instance passes health checks and receives traffic`,
                ],
                why: `ELB health checks feed into the group's view of health; the group then replaces the instance, and traffic only returns once the new one is healthy.`,
              },
              {
                type: "mcq", level: 3,
                q: `A company runs a legacy reporting application that can only run as a single instance because it holds a lock on shared files. The application must recover automatically from both instance failures and the loss of an entire Availability Zone. Its data is on shared storage that's reachable from every AZ. The company wants the lowest cost. Which solution meets these requirements?`,
                options: [
                  { t: `An Auto Scaling group with min, max and desired of 1 across two AZs.`, ok: true, why: `Exactly one instance at a time, replaced automatically, in the other AZ if its AZ fails.` },
                  { t: `A CloudWatch alarm with the EC2 recover action on the instance.`, ok: false, why: `Recovery moves the instance to new hardware in the same AZ; it doesn't help if the whole AZ fails.` },
                  { t: `Two instances in different AZs, both running the application at all times.`, ok: false, why: `The app can only run as one copy, and you'd pay for two.` },
                  { t: `An Auto Scaling group with min 1 and max 2 in a single AZ.`, ok: false, why: `It self-heals, but an AZ failure takes it down, and it could run two copies.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A team is creating a new Auto Scaling group that should mix several instance types and use Spot Instances. What should it launch from?`,
                options: [
                  { t: `A launch template`, ok: true, why: `Launch templates support mixed instance types, Spot and versions. Launch configurations are the older format and don't.` },
                  { t: `A launch configuration`, ok: false, why: `Legacy; no mixed instances policy and no new features.` },
                  { t: `A running instance used as the model`, ok: false, why: `You can create a template from an instance, but the group launches from a template.` },
                  { t: `An EBS snapshot`, ok: false, why: `Snapshots are disk backups, not launch settings.` },
                ],
              },
            ],
          },
          {
            id: "asg-health", title: "Health checks, grace periods, hooks and warm pools", domain: "resilient",
            variants: [
              {
                type: "mcq", level: 1,
                q: `By default, which health check does an Auto Scaling group use to decide an instance is unhealthy?`,
                options: [
                  { t: `EC2 status checks`, ok: true, why: `By default only the VM's own status checks count. ELB health checks have to be turned on.` },
                  { t: `The load balancer's HTTP health checks`, ok: false, why: `Only if you turn on ELB health checks for the group.` },
                  { t: `CPU above 90%`, ok: false, why: `High CPU is a scaling signal, not a health check.` },
                  { t: `A manual check by an operator`, ok: false, why: `The whole point is that it's automatic.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `An app process sometimes hangs. The instance keeps running, the load balancer marks it unhealthy, but the Auto Scaling group never replaces it. What's missing?`,
                options: [
                  { t: `ELB health checks turned on for the Auto Scaling group`, ok: true, why: `Without them the group only sees EC2 status checks, which pass because the VM itself is fine.` },
                  { t: `A larger maximum capacity`, ok: false, why: `The group doesn't think anything is wrong, so max doesn't matter.` },
                  { t: `A lifecycle hook that runs a health script when instances launch`, ok: false, why: `Hooks run scripts at launch or termination; they don't detect a hung app.` },
                  { t: `A spread placement group`, ok: false, why: `Placement doesn't affect health checks.` },
                ],
              },
              {
                type: "multi", level: 3,
                q: `A company's Auto Scaling group uses ELB health checks. New instances take about 6 minutes to load data before the app answers health checks, and the group keeps terminating them as unhealthy before they're ready. The company also has to keep each instance's application logs: when the group scales in, the logs on the terminated instance are lost. Which actions meet these requirements? (Choose two.)`,
                options: [
                  { t: `Set the health check grace period to longer than the 6 minutes the app needs to start.`, ok: true, why: `The group waits before judging new instances, so they get time to finish loading.` },
                  { t: `Add a terminating lifecycle hook that runs a script to copy the logs to Amazon S3 before the instance is terminated.`, ok: true, why: `The hook pauses termination so the logs can be copied off first.` },
                  { t: `Switch the group back to EC2 status checks only.`, ok: false, why: `New instances would survive, but hung apps would never be replaced again.` },
                  { t: `Raise the group's maximum capacity so replacements launch faster.`, ok: false, why: `Max doesn't change how new instances are judged or how logs are kept.` },
                  { t: `Add a scheduled action that scales in only at night.`, ok: false, why: `Logs would still be lost at night, and scaling would no longer follow demand.` },
                ],
              },
              {
                type: "mcq", level: 3,
                q: `An application on an Auto Scaling group needs about 10 minutes to boot and initialize, so scale-outs during sudden traffic spikes arrive too late. Traffic is fairly low most of the day, and the company doesn't want to pay for idle running instances. Which solution meets these requirements MOST cost-effectively?`,
                options: [
                  { t: `Add a warm pool of pre-initialized instances in the stopped state.`, ok: true, why: `Stopped warm instances already did their slow initialization and start in seconds; you pay only for their storage while they wait.` },
                  { t: `Raise the group's minimum capacity to cover the largest spike.`, ok: false, why: `Fast, but you pay for idle running instances all day.` },
                  { t: `Change to a larger instance type so initialization finishes sooner.`, ok: false, why: `Initialization is mostly loading and configuring; a larger type costs more and barely helps.` },
                  { t: `Change the scaling policy from target tracking to step scaling.`, ok: false, why: `Different trigger, same 10-minute boot.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `What do min, desired and max mean in an Auto Scaling group? Why turn on ELB health checks, and what does the grace period protect against?`,
          points: [
            `Desired is the current target; min and max are the limits scaling can move it between`,
            `The group replaces unhealthy instances and spreads across AZs, relaunching in healthy AZs`,
            `Default health check is EC2 status only; ELB health checks catch a hung app on a healthy VM`,
            `Grace period: don't judge new instances before they've finished starting`,
          ],
        },
      },

      {
        id: "scaling-policies", title: "Scaling policies", min: 4,
        tryFirst: {
          type: "mcq",
          q: `An internal app's traffic jumps every Monday at exactly 09:00 when a weekly report is released. Instances added after the jump arrive too late. What should the Auto Scaling group use?`,
          options: [
            { t: `A scheduled action that raises capacity shortly before 09:00 on Mondays`, ok: true, why: `When you know exactly when load will come, schedule the capacity ahead of it.` },
            { t: `A target tracking policy on CPU`, ok: false, why: `Useful for everyday changes, but it only reacts after the CPU has already risen.` },
            { t: `A larger maximum capacity`, ok: false, why: `Max is a ceiling; it doesn't add instances by itself.` },
            { t: `A longer health check grace period`, ok: false, why: `That's about judging health, not about capacity.` },
          ],
        },
        body: `<p>Scaling policies change the group's desired capacity:</p>
<div class="tablewrap"><table><thead><tr><th>Policy</th><th>How it works</th><th>Use it for</th></tr></thead><tbody>
<tr><td><strong>Target tracking</strong></td><td>Keep a metric near a target, like a thermostat (CPU at 50%, or 1,000 requests per target)</td><td>The default choice for most apps</td></tr>
<tr><td><strong>Step scaling</strong></td><td>CloudWatch alarm thresholds add or remove set amounts (CPU &gt; 70%: +2, &gt; 90%: +5)</td><td>When you want precise control over big jumps</td></tr>
<tr><td><strong>Scheduled</strong></td><td>Set capacity at a time you choose</td><td>Known events: Monday 09:00, a sale, a nightly batch</td></tr>
<tr><td><strong>Predictive</strong></td><td>Learns daily and weekly patterns and adds capacity <em>before</em> the forecast load</td><td>Regular cycles, especially with slow-starting instances</td></tr></tbody></table></div>
<p><strong>Pick the right metric.</strong> CPU is fine for compute-bound web apps. For a web tier, <code>ALBRequestCountPerTarget</code> often tracks load better. For workers that pull jobs from an <strong>SQS queue</strong>, scale on <strong>backlog per instance</strong>: messages waiting ÷ running instances. Target = how many messages one instance can handle within your acceptable delay (e.g. 10 minutes allowed ÷ 6 seconds per message = 100 messages per instance).</p>
<p>New instances need time before their metrics are meaningful: set an <strong>instance warmup</strong> so they aren't counted too early. When workers handle long jobs, <strong>scale-in protection</strong> stops the group from terminating an instance that's still busy; the app turns it on when it picks up a job and off when it's done.</p>`,
        example: `<p>An image-resizing service: an ASG of workers reads from an SQS queue. Each worker handles 10 images a second and the business accepts 2 minutes of delay, so the target is 1,200 messages per instance. When 12,000 messages pile up, the group grows to 10 workers; when the queue empties, it shrinks back.</p>`,
        concepts: [
          {
            id: "policy-types", title: "Target tracking, step, scheduled, predictive", domain: "performance",
            variants: [
              {
                type: "mcq", level: 1,
                q: `You want an Auto Scaling group to keep average CPU around 50% automatically, adding and removing instances as needed. Which policy?`,
                options: [
                  { t: `Target tracking`, ok: true, why: `You give it the target; it works out how many instances to add or remove.` },
                  { t: `Scheduled scaling`, ok: false, why: `That changes capacity at set times, regardless of CPU.` },
                  { t: `A lifecycle hook`, ok: false, why: `Hooks run scripts at launch or termination; they don't scale.` },
                  { t: `Manual scaling`, ok: false, why: `Not automatic.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A retailer knows a flash sale starts at 20:00 on Friday and ends at midnight. Instances take 5 minutes to be ready. What should it add to its target tracking policy?`,
                options: [
                  { t: `A scheduled action that raises the minimum capacity before 20:00 and lowers it after midnight`, ok: true, why: `Capacity is ready when the rush starts; target tracking still handles anything unexpected on top.` },
                  { t: `A lower CPU target for the whole week`, ok: false, why: `Pays for extra instances all week, and still reacts only after load arrives.` },
                  { t: `Step scaling instead of target tracking`, ok: false, why: `Still reactive, so the first minutes of the sale would be slow.` },
                  { t: `A longer instance warmup`, ok: false, why: `That makes scaling react more slowly, not faster.` },
                ],
              },
              {
                type: "mcq", level: 3,
                q: `A company's customer portal runs on an Auto Scaling group. Every weekday, traffic rises steeply between 07:30 and 09:00 and falls in the evening, and the exact shape shifts gradually over the seasons. Instances need several minutes to start. Users complain about slow responses each morning while target tracking catches up. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
                options: [
                  { t: `Add a predictive scaling policy alongside the target tracking policy.`, ok: true, why: `It learns the daily cycle, keeps learning as it shifts, and launches capacity ahead of the morning rise.` },
                  { t: `Add scheduled actions for each weekday morning and update them as the pattern changes.`, ok: false, why: `It would work, but someone has to keep adjusting the schedules as the seasons change.` },
                  { t: `Raise the minimum capacity to the morning peak for the whole day.`, ok: false, why: `Solves the mornings, but pays for peak capacity around the clock.` },
                  { t: `Replace target tracking with simple scaling and a 10-minute cooldown.`, ok: false, why: `Simple scaling with a long cooldown reacts even more slowly.` },
                ],
              },
              {
                type: "spot", level: 2, unit: "setting",
                q: `Traffic triples during the day, but this Auto Scaling group never adds instances. Which setting is the problem?`,
                cols: ["Setting", "Value"],
                rows: [
                  { cells: ["Scaling policy", "Target tracking, average CPU 50%"], why: `A sensible target.` },
                  { cells: ["Minimum capacity", "2"], why: `Fine as a floor.` },
                  { cells: ["Maximum capacity", "2"], bad: true, why: `With max equal to min, the group can never grow, whatever the policy says.` },
                  { cells: ["Instance warmup", "300 seconds"], why: `A normal warmup.` },
                ],
              },
            ],
          },
          {
            id: "queue-scaling", title: "Scaling workers on a queue", domain: "performance",
            variants: [
              {
                type: "mcq", level: 2,
                q: `Worker instances in an Auto Scaling group pull jobs from an SQS queue. Which metric should the group scale on?`,
                options: [
                  { t: `Messages waiting per running instance (backlog per instance)`, ok: true, why: `It measures how far behind each worker is, which is what you actually care about.` },
                  { t: `Average CPU of the workers`, ok: false, why: `Workers can sit at steady CPU while the queue grows, or be busy with a tiny backlog.` },
                  { t: `ALB request count per target`, ok: false, why: `Queue workers aren't behind a load balancer.` },
                  { t: `Network bytes in`, ok: false, why: `Says little about how many jobs are waiting.` },
                ],
              },
              {
                type: "fill", level: 1,
                q: `Which ALB metric is commonly used with target tracking to keep the number of requests each instance handles steady? (one word, CamelCase)`,
                accept: ["ALBRequestCountPerTarget", "RequestCountPerTarget"], placeholder: "metric name",
                why: `ALBRequestCountPerTarget: requests per target. Good for web tiers where requests, not CPU, drive load.`,
              },
              {
                type: "multi", level: 3,
                q: `A photo service puts upload jobs in an Amazon SQS queue, and EC2 workers in an Auto Scaling group process them. Each job takes about 6 seconds, and the business accepts up to 10 minutes of delay. The queue is empty overnight but sometimes jumps to 50,000 messages during the day. Jobs can be retried safely. The company wants to meet the delay target at the lowest cost. Which actions meet these requirements? (Choose two.)`,
                options: [
                  { t: `Use target tracking on backlog per instance, with a target of about 100 messages per instance.`, ok: true, why: `600 seconds allowed ÷ 6 seconds per job = 100 messages per worker; the group sizes itself to keep the delay under 10 minutes.` },
                  { t: `Run the workers as Spot Instances across several instance types.`, ok: true, why: `Retryable jobs tolerate interruptions, and Spot cuts the cost by up to 90%.` },
                  { t: `Use target tracking on the workers' average CPU at 70%.`, ok: false, why: `CPU doesn't show how many jobs are waiting, so the delay target can be missed.` },
                  { t: `Keep enough workers running at all times to clear 50,000 messages in 10 minutes.`, ok: false, why: `Meets the target, but pays for a big idle fleet most of the day.` },
                  { t: `Use step scaling on the total number of messages in the queue, adding 1 instance per alarm.`, ok: false, why: `Total messages ignore how many workers already run, and adding one at a time is too slow for 50,000.` },
                ],
              },
              {
                type: "mcq", level: 3,
                q: `A company runs video processing workers in an Auto Scaling group that scales on the length of an Amazon SQS queue. Each job takes up to 3 hours. When the queue shrinks, the group sometimes terminates workers in the middle of a job, wasting hours of work. The company wants to stop this while still letting the group scale in. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
                options: [
                  { t: `Have workers turn on scale-in protection while they process a job.`, ok: true, why: `Each worker protects itself when it picks up a job and unprotects itself when done. The group skips protected instances when scaling in, so only idle workers are removed.` },
                  { t: `Increase the scaling cooldown to 3 hours.`, ok: false, why: `It just delays scale-in; a busy worker can still be picked when it happens.` },
                  { t: `Change the termination policy to terminate the oldest instance first.`, ok: false, why: `The oldest instance may well be the one in the middle of a job.` },
                  { t: `Scale on the workers' CPU instead of on the queue length.`, ok: false, why: `Busy and idle workers can look the same on CPU; the group can still pick a busy one.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `When would you use target tracking, scheduled and predictive scaling? How would you scale workers that read from an SQS queue?`,
          points: [
            `Target tracking: keep a metric near a target, the default for most apps`,
            `Scheduled: known times; predictive: recurring patterns, capacity before the load arrives`,
            `Queue workers: backlog per instance, target = acceptable delay ÷ time per message`,
            `Scale-in protection keeps busy workers from being terminated mid-job`,
          ],
        },
      },

      {
        id: "load-balancers", title: "Load balancers: ALB, NLB, GWLB", min: 5,
        tryFirst: {
          type: "mcq",
          q: `A site must send requests for /api/* to one group of servers and /images/* to another. What can do that routing?`,
          options: [
            { t: `An Application Load Balancer with path-based rules`, ok: true, why: `ALBs read the HTTP request and can route by path, host name, headers and more.` },
            { t: `A Network Load Balancer`, ok: false, why: `NLBs work at the TCP/UDP level and never look at the URL path.` },
            { t: `A security group`, ok: false, why: `Security groups allow or block traffic; they don't route it.` },
            { t: `Two Elastic IPs`, ok: false, why: `IP addresses can't tell paths apart.` },
          ],
        },
        body: `<p><strong>Elastic Load Balancing</strong> spreads traffic across healthy targets (instances, IPs, containers, Lambda functions) in several AZs and stops sending to unhealthy ones.</p>
<div class="tablewrap"><table><thead><tr><th></th><th>Application LB (ALB)</th><th>Network LB (NLB)</th><th>Gateway LB (GWLB)</th></tr></thead><tbody>
<tr><td>Layer</td><td>7: HTTP, HTTPS, gRPC, WebSockets</td><td>4: TCP, UDP, TLS</td><td>3: all IP packets</td></tr>
<tr><td>Routing</td><td>By path, host, header, query string; redirects; fixed responses</td><td>By port only</td><td>Sends traffic through appliances</td></tr>
<tr><td>Speed</td><td>Fast</td><td>Millions of requests a second, very low latency</td><td>-</td></tr>
<tr><td>IP address</td><td>Changes (use the DNS name)</td><td>One static IP per AZ, can be an Elastic IP</td><td>-</td></tr>
<tr><td>Typical use</td><td>Websites, APIs, microservices</td><td>Games, IoT, non-HTTP protocols, static IPs, PrivateLink</td><td>Third-party firewalls and inspection</td></tr></tbody></table></div>
<p><strong>ALB extras:</strong> TLS termination with certificates from ACM, many HTTPS sites on one ALB using <strong>SNI</strong> (the client says which host name it wants, and the ALB presents the matching certificate), sign-in through Cognito or any OIDC provider before requests reach the app, and AWS WAF.</p>
<p><strong>Settings worth knowing:</strong></p>
<ul><li><strong>Sticky sessions</strong>: send a user back to the same target (cookie-based). A quick fix for apps that keep sessions in memory; better long term is keeping sessions outside the instances.</li>
<li><strong>Deregistration delay</strong> (connection draining): when a target is removed, existing requests get time to finish (default 300 seconds).</li>
<li><strong>Cross-zone load balancing</strong>: spread traffic evenly across all targets in all AZs instead of evenly per AZ. On by default for ALB; off by default for NLB and GWLB.</li></ul>
<p>The old Classic Load Balancer still exists but isn't used for new designs.</p>`,
        example: `<p>An online game: the login and store pages go through an ALB (HTTPS, path routing). The game traffic itself is UDP on a custom port, so it goes through an NLB, which also gives each AZ a fixed IP for players' firewalls.</p>`,
        concepts: [
          {
            id: "lb-choice", title: "Choosing ALB, NLB or GWLB", domain: "performance",
            variants: [
              {
                type: "mcq", level: 1,
                q: `Which load balancer can route HTTP requests based on the URL path or host name?`,
                options: [
                  { t: `Application Load Balancer`, ok: true, why: `Layer 7: it reads the HTTP request.` },
                  { t: `Network Load Balancer`, ok: false, why: `Layer 4: it sees connections and ports, not paths.` },
                  { t: `Gateway Load Balancer`, ok: false, why: `Sends packets through appliances; no HTTP routing.` },
                  { t: `None; routing by path needs a proxy on an instance`, ok: false, why: `The ALB does it natively.` },
                ],
              },
              {
                type: "multi", level: 3,
                q: `A gaming company is launching a multiplayer game on Amazon EC2 in two Availability Zones. Game clients talk to the servers over UDP on port 7777, and millions of packets per second are expected at peak with the lowest possible latency. Several corporate customers will only allow outbound traffic to fixed IP addresses on their firewalls. Which load balancer features meet these requirements? (Choose two.)`,
                options: [
                  { t: `A Network Load Balancer with a UDP listener on port 7777.`, ok: true, why: `NLBs handle UDP at very high packet rates with very low latency.` },
                  { t: `An Elastic IP address assigned to the Network Load Balancer in each AZ.`, ok: true, why: `NLBs keep one static IP per AZ, and you can use your own Elastic IPs that customers allowlist.` },
                  { t: `An Application Load Balancer with path-based routing rules.`, ok: false, why: `ALBs only handle HTTP(S) and gRPC, not raw UDP.` },
                  { t: `A Gateway Load Balancer in front of the game servers.`, ok: false, why: `GWLBs send traffic through inspection appliances; they're not for serving clients.` },
                  { t: `Sticky sessions on an Application Load Balancer target group.`, ok: false, why: `Still an ALB, which can't carry UDP game traffic.` },
                ],
              },
              {
                type: "mcq", level: 3,
                q: `A company must send all traffic entering and leaving its VPCs through a fleet of third-party firewall appliances it already licenses. The appliances must scale with traffic and be replaced automatically if one fails, and application routing should not change when appliances are added or removed. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
                options: [
                  { t: `Put the appliances behind a Gateway Load Balancer and route traffic through its endpoints.`, ok: true, why: `GWLB is built for exactly this: it spreads traffic across appliances, health-checks them, and apps keep routing to the endpoint.` },
                  { t: `Deploy the appliances behind a Network Load Balancer and point each subnet's routes at the appliances' IPs.`, ok: false, why: `Route tables would point at individual appliances, so every change means editing routes by hand.` },
                  { t: `Deploy the appliances behind an Application Load Balancer and send all VPC traffic to its DNS name.`, ok: false, why: `ALBs only handle HTTP(S) and can't sit transparently in the path of all traffic.` },
                  { t: `Run one large appliance per VPC with an Elastic IP and route all traffic through it.`, ok: false, why: `No scaling, and one failure stops all traffic.` },
                ],
              },
              {
                type: "elim", level: 2,
                q: `A trading platform needs a load balancer for its order-matching servers.`,
                reqs: [`Clients connect with a custom TCP protocol, not HTTP`, `Lowest possible latency at millions of requests per second`, `Servers must see each client's real IP address`],
                options: [
                  { t: `Network Load Balancer`, ok: true, why: `Layer 4 TCP, very low latency at huge scale, and it preserves client IPs.` },
                  { t: `Application Load Balancer`, ok: false, kills: [0], why: `HTTP(S) and gRPC only; a custom TCP protocol won't pass through.` },
                  { t: `Classic Load Balancer`, ok: false, kills: [1], why: `Legacy, and it doesn't scale or perform like an NLB.` },
                  { t: `Gateway Load Balancer`, ok: false, kills: [0, 1], why: `Built to send traffic through inspection appliances, not to serve clients.` },
                ],
              },
            ],
          },
          {
            id: "lb-features", title: "SNI, sticky sessions, draining, cross-zone", domain: "performance",
            variants: [
              {
                type: "mcq", level: 1,
                q: `One ALB must serve HTTPS for shop.example.com and blog.example.net, each with its own certificate. What makes that work?`,
                options: [
                  { t: `SNI: the ALB picks the certificate that matches the requested host name`, ok: true, why: `Server Name Indication lets one HTTPS listener hold many certificates.` },
                  { t: `One ALB per domain`, ok: false, why: `Works, but isn't needed.` },
                  { t: `A Network Load Balancer instead`, ok: false, why: `Not needed; ALBs support SNI.` },
                  { t: `Sticky sessions`, ok: false, why: `Stickiness is about sessions, not certificates.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `An app keeps users' shopping carts in each server's memory. Behind a new ALB, users see their carts disappear between clicks. What's the quickest fix that needs no code changes?`,
                options: [
                  { t: `Turn on sticky sessions on the target group`, ok: true, why: `Each user keeps going to the server that has their cart. (Long term, keep sessions outside the servers so a server failure doesn't lose them.)` },
                  { t: `Turn on cross-zone load balancing on the load balancer`, ok: false, why: `That evens traffic across AZs; users would still hop between servers.` },
                  { t: `Raise the deregistration delay`, ok: false, why: `That only helps when servers are being removed.` },
                  { t: `Switch to a Network Load Balancer`, ok: false, why: `Doesn't solve the problem, and loses HTTP features.` },
                ],
              },
              {
                type: "mcq", level: 3,
                q: `A company deploys new versions of its web application by replacing instances behind an Application Load Balancer. Some API calls take up to 90 seconds to complete. During every deployment, users report errors for requests that were in progress on the instances being removed. The company wants to fix this without changing the application code. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
                options: [
                  { t: `Set the target group's deregistration delay to longer than the slowest request, for example 120 seconds.`, ok: true, why: `The ALB stops sending new requests to the leaving instance but lets requests in progress finish first.` },
                  { t: `Turn on sticky sessions so users stay on the same instance during deployments.`, ok: false, why: `Users would be pinned to an instance that's about to disappear.` },
                  { t: `Turn on cross-zone load balancing on the load balancer.`, ok: false, why: `It changes how traffic is spread, not what happens to requests in progress.` },
                  { t: `Turn on slow start mode for the target group.`, ok: false, why: `Slow start eases new instances in; it does nothing for the ones leaving.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A Network Load Balancer has 2 targets in AZ a and 8 targets in AZ b. The 2 targets in AZ a are overloaded while the others are mostly idle. What should you change?`,
                options: [
                  { t: `Turn on cross-zone load balancing`, ok: true, why: `It's off by default for NLBs, so each AZ gets half the traffic. With it on, all 10 targets share the load evenly.` },
                  { t: `Turn on sticky sessions`, ok: false, why: `Stickiness keeps clients on the same targets; it doesn't fix the split per AZ.` },
                  { t: `Add an Elastic IP to the NLB in AZ b`, ok: false, why: `IP addresses don't change how traffic is shared.` },
                  { t: `Lower the deregistration delay`, ok: false, why: `Only matters when targets are removed.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `How do you choose between an ALB, an NLB and a GWLB? Give one setting you'd change for a deployment that drops in-flight requests, and why.`,
          points: [
            `ALB: layer 7 HTTP(S), routing by path/host/header, SNI, auth, WAF`,
            `NLB: layer 4 TCP/UDP, very low latency at huge scale, static IP per AZ (Elastic IPs), keeps client IP`,
            `GWLB: sends traffic through third-party appliances transparently`,
            `Deregistration delay lets requests in progress finish before a target is removed`,
          ],
        },
      },

      {
        id: "ha-web-tier", title: "Putting it together: a highly available web tier", min: 4,
        tryFirst: {
          type: "mcq",
          q: `A web app has a public Application Load Balancer in front of its EC2 instances. Where should the instances live?`,
          options: [
            { t: `In private subnets, reachable only through the load balancer`, ok: true, why: `The ALB sits in public subnets and reaches the instances privately. The instances never need to be reachable from the internet.` },
            { t: `In public subnets with Elastic IPs`, ok: false, why: `It works, but every instance is now directly exposed to the internet for no reason.` },
            { t: `In the same subnet as the load balancer, with no security group`, ok: false, why: `Every instance has a security group, and they shouldn't be public.` },
            { t: `In a different Region from the load balancer`, ok: false, why: `Load balancers send traffic to targets in their own Region.` },
          ],
        },
        body: `<p>The standard highly available web tier, which you'll see in exam questions over and over:</p>
<ul><li>An internet-facing <strong>ALB</strong> in <strong>public subnets</strong> in at least two AZs.</li>
<li>An <strong>Auto Scaling group</strong> in <strong>private subnets</strong> in the same AZs, with ELB health checks.</li>
<li>Security groups chained: the ALB's security group allows 443 from the internet; the instances' security group allows the app port <em>only from the ALB's security group</em>. Nothing on the internet can reach an instance directly.</li>
<li>HTTPS on the ALB with an ACM certificate; an HTTP listener that only redirects to HTTPS.</li>
<li>Outbound internet for updates through a NAT gateway (one per AZ for resilience).</li></ul>
<p><strong>Sizing for an AZ failure.</strong> If you need 4 instances to carry the load, 2 AZs × 2 isn't enough: lose one AZ and only 2 are left until the group catches up. Either run 4 in each of 2 AZs (8 total) or 2 in each of 3 AZs (6 total). More AZs means less spare capacity to pay for.</p>
<p><strong>Rolling out new versions:</strong> update the launch template, then start an <strong>instance refresh</strong>, which replaces instances in batches while keeping a minimum healthy percentage, and can roll back automatically if the new version fails.</p>
<p>ALBs can also check who the user is before any request reaches your app: an <strong>authenticate</strong> action on a listener rule signs users in with Amazon Cognito or any OIDC identity provider (like the company's SSO).</p>`,
        example: `<p>An internal HR app must only be used by employees. Rather than adding login code, the ALB's HTTPS listener gets an authenticate-oidc rule pointing at the company's identity provider. Users who aren't signed in are sent to log in first; the app receives the user's identity in a header.</p>`,
        concepts: [
          {
            id: "lb-security", title: "Securing the load balanced tier", domain: "secure",
            variants: [
              {
                type: "mcq", level: 1,
                q: `EC2 instances sit behind an ALB. Their security group should allow the app port inbound from:`,
                options: [
                  { t: `The ALB's security group`, ok: true, why: `Only the load balancer can reach the instances, wherever its IPs happen to be.` },
                  { t: `0.0.0.0/0`, ok: false, why: `That lets anyone reach the instances directly, bypassing the ALB.` },
                  { t: `The ALB's current IP addresses`, ok: false, why: `ALB IPs change; referencing its security group always matches.` },
                  { t: `Nothing; the ALB doesn't need an inbound rule`, ok: false, why: `Without an inbound rule the ALB can't reach the instances.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A site behind an ALB must only be served over HTTPS, but users who type the address without https:// should still reach it. What's the usual setup?`,
                options: [
                  { t: `An HTTPS listener with an ACM certificate, plus an HTTP listener that redirects to HTTPS`, ok: true, why: `Everything is served encrypted, and plain HTTP visitors are sent to the HTTPS address.` },
                  { t: `Only an HTTP listener, with the app forcing HTTPS`, ok: false, why: `The ALB can't serve HTTPS without an HTTPS listener and certificate.` },
                  { t: `Only an HTTPS listener`, ok: false, why: `Secure, but visitors who type http:// get a connection error.` },
                  { t: `A Network Load Balancer passing port 80 through`, ok: false, why: `Plain HTTP is never encrypted that way.` },
                ],
              },
              {
                type: "multi", level: 3,
                q: `A company is deploying a public web application on EC2 instances in an Auto Scaling group behind an internet-facing Application Load Balancer, across two Availability Zones. A security review requires that the instances can't be reached directly from the internet under any circumstances, while the application stays reachable for users. Which actions meet these requirements? (Choose two.)`,
                options: [
                  { t: `Place the ALB in public subnets and the instances in private subnets.`, ok: true, why: `Private subnets have no route from the internet; only the ALB is exposed.` },
                  { t: `Allow the application port in the instances' security group only from the ALB's security group.`, ok: true, why: `Even inside the VPC, only the load balancer can reach the app.` },
                  { t: `Allow the application port in the instances' security group from 0.0.0.0/0, and rely on the ALB to filter traffic.`, ok: false, why: `Anyone who can route to the instances could reach them directly.` },
                  { t: `Place the instances in public subnets with Elastic IP addresses and restrict access with network ACLs.`, ok: false, why: `The instances would have public addresses; one wrong NACL rule exposes them.` },
                  { t: `Place the ALB in private subnets so that it's hidden from the internet.`, ok: false, why: `An internet-facing ALB needs public subnets, or users can't reach the app at all.` },
                ],
              },
              {
                type: "mcq", level: 3,
                q: `A company has an internal web application on EC2 instances behind an Application Load Balancer. The application has no login code, and only employees should be able to use it. The company already uses an OpenID Connect (OIDC) compatible identity provider for single sign-on. The company wants to add authentication without changing the application. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
                options: [
                  { t: `Add an authenticate-oidc action to the ALB listener rule.`, ok: true, why: `The ALB signs users in before forwarding requests; the app needs no changes.` },
                  { t: `Add login code to the application that talks to the identity provider.`, ok: false, why: `Works, but it's exactly the code change the company wants to avoid.` },
                  { t: `Allow only the office IP range in the ALB's security group.`, ok: false, why: `That limits where people connect from, not who they are.` },
                  { t: `Replace the ALB with a Network Load Balancer that uses a TLS listener.`, ok: false, why: `NLBs can't authenticate users.` },
                ],
              },
            ],
          },
          {
            id: "ha-design", title: "Designing for AZ failure and safe deployments", domain: "resilient",
            variants: [
              {
                type: "mcq", level: 2,
                q: `A web app runs on one EC2 instance with an Elastic IP. It must keep working if an Availability Zone fails. What's the standard fix?`,
                options: [
                  { t: `An Auto Scaling group across two or more AZs behind an Application Load Balancer`, ok: true, why: `The ALB sends traffic only to healthy instances, and the group keeps instances running in the AZs that are still up.` },
                  { t: `A bigger instance with an Elastic IP`, ok: false, why: `Still one instance in one AZ.` },
                  { t: `A daily AMI of the instance`, ok: false, why: `Helps rebuild by hand, but the app is down until someone does it.` },
                  { t: `A cluster placement group`, ok: false, why: `That's about latency in one AZ, the opposite of surviving an AZ failure.` },
                ],
              },
              {
                type: "spot", level: 1, unit: "row",
                q: `This web tier went down when AZ a had an outage. Which part of the design caused it?`,
                cols: ["Component", "Configuration"],
                rows: [
                  { cells: ["Application Load Balancer", "Public subnets in AZ a and AZ b"], why: `The ALB spans both AZs.` },
                  { cells: ["Auto Scaling group", "Private subnet in AZ a only"], bad: true, why: `Every instance lives in AZ a. When it failed, there was nowhere for the group to launch replacements.` },
                  { cells: ["Instance security group", "443 from the ALB security group"], why: `Correct chaining.` },
                  { cells: ["Health checks", "ELB health checks on the group"], why: `Correct.` },
                ],
              },
              {
                type: "mcq", level: 3,
                q: `A company's web tier must have at least 6 instances serving traffic at all times, even if one Availability Zone fails, so users never see slow responses while the group recovers. The Region has three Availability Zones. The company wants to minimize the number of running instances. Which Auto Scaling group configuration meets these requirements MOST cost-effectively?`,
                options: [
                  { t: `9 instances spread evenly across three AZs.`, ok: true, why: `Losing one AZ leaves 6, and spare capacity is only 3 instances.` },
                  { t: `12 instances spread evenly across two AZs.`, ok: false, why: `Losing one AZ also leaves 6, but you pay for 12 instead of 9.` },
                  { t: `6 instances spread evenly across three AZs.`, ok: false, why: `Losing one AZ leaves 4 until the group catches up.` },
                  { t: `6 instances in one AZ with a cluster placement group.`, ok: false, why: `One AZ failure takes everything down.` },
                ],
              },
              {
                type: "mcq", level: 3,
                q: `A company runs its application on an Auto Scaling group behind an Application Load Balancer. To release a new version, an engineer currently terminates instances by hand, a few at a time, after updating the launch template. Releases are slow, and twice a bad version reached all instances before anyone noticed. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
                options: [
                  { t: `Start an instance refresh with a minimum healthy percentage and auto rollback.`, ok: true, why: `The group replaces instances in batches, keeps enough healthy capacity, and rolls back if the new version fails.` },
                  { t: `Create a second Auto Scaling group for each release and switch DNS records by hand.`, ok: false, why: `Works, but it's a lot of manual steps every release.` },
                  { t: `Update the launch template and wait for instances to be replaced naturally over time.`, ok: false, why: `Old instances may run for weeks, and a bad version spreads with nobody watching.` },
                  { t: `Terminate all instances at once after updating the launch template.`, ok: false, why: `Fast, but causes downtime, and a bad version hits everyone at once.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `Describe a highly available, secure web tier with an ALB and an Auto Scaling group. How do you size it so an AZ failure doesn't overload it?`,
          points: [
            `ALB in public subnets, instances in private subnets, in 2+ AZs`,
            `Instance security group allows the app port only from the ALB's security group`,
            `HTTPS with ACM on the ALB; HTTP listener redirects to HTTPS`,
            `Size so the remaining AZs carry the full load (e.g. need 6: 3 per AZ × 3 AZs = 9); more AZs = less spare`,
          ],
        },
      },

      {
        id: "ec2-ops", title: "Running instances: roles, metadata, stop and hibernate", min: 4,
        tryFirst: {
          type: "mcq",
          q: `An app on EC2 needs to read files from an S3 bucket. How should it get AWS credentials?`,
          options: [
            { t: `From an IAM role attached to the instance`, ok: true, why: `The instance gets temporary credentials that rotate automatically. No keys to store or leak.` },
            { t: `An access key in the app's config file`, ok: false, why: `Long-lived keys on disk can leak and have to be rotated by hand.` },
            { t: `The root user's access keys`, ok: false, why: `Never create root access keys.` },
            { t: `A shared IAM user's password`, ok: false, why: `Apps don't sign in with passwords, and sharing removes accountability.` },
          ],
        },
        body: `<p><strong>Credentials for apps on EC2.</strong> Attach an <strong>IAM role</strong> to the instance (through an <em>instance profile</em>). The SDKs fetch temporary credentials for it from the <strong>instance metadata service</strong> (IMDS) automatically, and they rotate on their own. Use <strong>IMDSv2</strong>, which requires a session token first; this blocks attacks that trick an app into fetching metadata URLs for an attacker (SSRF).</p>
<p><strong>Stop, hibernate, terminate.</strong></p>
<ul><li><strong>Stop</strong>: the instance shuts down. You stop paying for the instance but still pay for its EBS volumes. Memory is lost; on start it boots fresh.</li>
<li><strong>Hibernate</strong>: memory (RAM) is saved to the encrypted EBS root volume. On start, apps continue exactly where they were, with caches still warm. Useful when startup is slow because of what's loaded into memory.</li>
<li><strong>Terminate</strong>: the instance is gone. Root EBS volumes are deleted by default.</li></ul>
<p><strong>Paying only for what you use.</strong> Dev and test instances that sit idle nights and weekends can be stopped on a schedule (for example with the Instance Scheduler solution or an EventBridge rule). Oversized instances are common: <strong>AWS Compute Optimizer</strong> analyzes real usage and recommends smaller or cheaper types (including Graviton).</p>`,
        example: `<p>A team's 20 dev instances run all week but are only used 50 hours of 168. Stopping them outside work hours cuts their instance cost by about 70%; they only keep paying for their disks.</p>`,
        concepts: [
          {
            id: "instance-roles", title: "Instance roles and IMDSv2", domain: "secure",
            variants: [
              {
                type: "mcq", level: 1,
                q: `What is the recommended way for an app on EC2 to call AWS services?`,
                options: [
                  { t: `Attach an IAM role to the instance and let the SDK use its temporary credentials`, ok: true, why: `No stored keys; credentials rotate automatically.` },
                  { t: `Store an IAM user's access keys in an environment variable`, ok: false, why: `Long-lived keys can leak and must be rotated by hand.` },
                  { t: `Hard-code access keys in the source code`, ok: false, why: `Keys in source code end up in repositories and leak.` },
                  { t: `Use the root user's credentials`, ok: false, why: `Never.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A security team wants to stop attackers from tricking a web app into fetching the instance's role credentials from the metadata service through a crafted URL. What should be enforced?`,
                options: [
                  { t: `IMDSv2, which requires a session token from a PUT request first`, ok: true, why: `A simple forged GET request can't get the token, so SSRF-style attacks can't read credentials.` },
                  { t: `Removing the IAM role and storing access keys on the instance instead`, ok: false, why: `Keys on disk are a bigger risk, not a smaller one.` },
                  { t: `A security group rule blocking 169.254.169.254`, ok: false, why: `Security groups don't control traffic to the metadata service.` },
                  { t: `Moving the instance to a private subnet`, ok: false, why: `The metadata service is reachable from any instance, public or private.` },
                ],
              },
              {
                type: "mcq", level: 3,
                q: `A company runs 200 EC2 instances that call Amazon S3 and Amazon SQS. Each instance reads an IAM user's access key from a configuration file, and the operations team rotates the keys by hand every 90 days. An audit found old keys that were never rotated. The company wants to remove the risk of long-lived credentials. Which solution meets these requirements with the <strong>LEAST</strong> operational overhead?`,
                options: [
                  { t: `Attach an IAM role with the needed permissions to the instances and remove the access keys.`, ok: true, why: `The SDK gets temporary credentials from the role that rotate automatically; nothing is left to manage or leak.` },
                  { t: `Write a script that rotates the access keys every 30 days and pushes them to every instance.`, ok: false, why: `Still long-lived keys on 200 machines, plus a script to maintain.` },
                  { t: `Store the access keys in an S3 bucket that the instances download from at boot.`, ok: false, why: `Still long-lived keys, and the instances need credentials to reach the bucket in the first place.` },
                  { t: `Create one IAM user per instance so each key can be revoked separately.`, ok: false, why: `Even more keys to rotate and track.` },
                ],
              },
              {
                type: "multi", level: 2,
                q: `Which statements about IAM roles for EC2 are true? (Choose two.)`,
                options: [
                  { t: `The role is attached to the instance through an instance profile`, ok: true, why: `The instance profile is the container that passes the role to EC2.` },
                  { t: `The SDK gets temporary credentials from the instance metadata service and refreshes them automatically`, ok: true, why: `No code changes needed for rotation.` },
                  { t: `The credentials never expire once the role is attached`, ok: false, why: `They're temporary and rotated automatically.` },
                  { t: `An instance can't have a role if it's in a private subnet`, ok: false, why: `Roles work the same in any subnet.` },
                  { t: `Attaching a role requires stopping the instance`, ok: false, why: `You can attach or replace a role on a running instance.` },
                ],
              },
            ],
          },
          {
            id: "stop-hibernate", title: "Stop, hibernate and right-sizing", domain: "cost",
            variants: [
              {
                type: "mcq", level: 1,
                q: `What does hibernating an EC2 instance do with its memory (RAM)?`,
                options: [
                  { t: `Saves it to the encrypted EBS root volume and restores it on start`, ok: true, why: `Apps resume where they left off, with in-memory data intact.` },
                  { t: `Discards it, like a normal stop`, ok: false, why: `That's stop; hibernate keeps it.` },
                  { t: `Copies it to Amazon S3`, ok: false, why: `It's saved on the root EBS volume.` },
                  { t: `Keeps it in RAM on the host while you're not billed`, ok: false, why: `The host is released; the RAM contents go to EBS.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A team has 20 development instances used only 08:00–18:00 on weekdays. What's the simplest way to cut their cost a lot?`,
                options: [
                  { t: `Stop them outside working hours on a schedule`, ok: true, why: `Stopped instances aren't billed (only their disks are); they're idle about 70% of the week.` },
                  { t: `Buy 3-year Reserved Instances for them`, ok: false, why: `A discount for paying 24/7, when they're only needed about 30% of the time.` },
                  { t: `Move them to Dedicated Instances`, ok: false, why: `More expensive, not less.` },
                  { t: `Terminate them every night and rebuild by hand each morning`, ok: false, why: `Saves a little more on disks, but loses work and wastes hours.` },
                ],
              },
              {
                type: "multi", level: 3,
                q: `A company runs 60 m5.4xlarge instances for an internal Linux application that also runs on ARM. Monitoring shows average CPU of 8% and memory use of 20%, with no spikes. The company wants to reduce costs without hurting performance and with as little manual analysis as possible. Which actions meet these requirements? (Choose two.)`,
                options: [
                  { t: `Use AWS Compute Optimizer recommendations to move to smaller instance sizes.`, ok: true, why: `It analyzes real usage and recommends right-sized types, so nobody has to study the metrics by hand.` },
                  { t: `Move to Graviton-based instance types after testing.`, ok: true, why: `The app runs on ARM, and Graviton gives better price-performance.` },
                  { t: `Buy 3-year Reserved Instances for the current m5.4xlarge fleet.`, ok: false, why: `It saves money, but locks in instances that are far too big for 3 years.` },
                  { t: `Move the fleet to Dedicated Hosts.`, ok: false, why: `Costs more, and the fleet doesn't need dedicated hardware.` },
                  { t: `Put the fleet in a cluster placement group.`, ok: false, why: `Placement affects network latency, not cost.` },
                ],
              },
              {
                type: "mcq", level: 3,
                q: `A company runs two standalone EC2 instances for an analytics tool that's used only during working hours. On startup, the tool spends about 15 minutes loading reference data into memory, and analysts complain about waiting each morning. The company currently stops the instances every evening to save money. Which solution meets these requirements MOST cost-effectively?`,
                options: [
                  { t: `Hibernate the instances each evening instead of stopping them.`, ok: true, why: `With hibernation turned on, the memory is saved to EBS and restored on start, so the data is already loaded; billing is the same as a stopped instance.` },
                  { t: `Keep the instances running all night so the data stays in memory.`, ok: false, why: `Solves the wait, but pays for the instances around the clock.` },
                  { t: `Create a new AMI each evening that includes the loaded memory.`, ok: false, why: `AMIs capture disks, not memory; the tool would still load the data on start.` },
                  { t: `Move to a larger instance type so the data loads faster.`, ok: false, why: `Pays more every hour for a few minutes saved.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `How should an app on EC2 get AWS credentials, and why IMDSv2? When would you hibernate instead of stopping an instance?`,
          points: [
            `IAM role through an instance profile; temporary credentials from the metadata service, rotated automatically`,
            `No access keys on instances; IMDSv2 needs a session token, which blocks SSRF credential theft`,
            `Stop: no instance charge, memory lost; hibernate: RAM saved to the encrypted EBS root, apps resume warm`,
            `Stop idle dev instances on a schedule; right-size with Compute Optimizer`,
          ],
        },
      },

    ],
  });
})();
