# WHy Prisma + Schema Setup took so much time

## The note I'd keep

> ### Prisma P1001 with Neon — Network Issue
>
> `P1001: Can't reach database server` does not necessarily mean Prisma/Neon is misconfigured.
>
> In my case, the Wi-Fi network had broken IPv6 connectivity. Neon hostname resolution returned an IPv6 address, but my machine couldn't establish a TCP connection to Neon over IPv6.
>
> I verified this independently:
>
> ```bash
> nc -vz <neon-host> 5432
> # IPv6 → timeout
> ```
>
> ```bash
> nc -4 -vz <neon-host> 5432
> # IPv4 → succeeded
> ```
>
> I also confirmed IPv6 was generally broken:
>
> ```bash
> curl -6 https://www.google.com -I
> # hangs
>
> curl -4 https://www.google.com -I
> # HTTP 200
> ```
>
> Switching to a mobile hotspot provided a working network route, after which:
>
> ```bash
> npx prisma migrate dev --name init
> ```
>
> succeeded.
>
> **Lesson:** Before changing Prisma configuration for `P1001`, test the database endpoint independently and distinguish between **DNS → TCP connectivity → PostgreSQL → Prisma**.

### The debugging pattern to remember

```text
P1001
  ↓
Can DNS resolve the hostname?
  ↓
Can TCP reach :5432?
  ↓
Try IPv4 / IPv6 separately
  ↓
Can a PostgreSQL client connect?
  ↓
Only then investigate Prisma
```

That's a much more valuable lesson than simply memorizing "use a hotspot."
