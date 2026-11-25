# A12 - Backups of the member database (aimate-db1)

Read-only check of aimate-db1 on 25 Nov 2026 13:20-13:40 UTC (`ssh -i ~/.ssh/aimate-db aimate@102.68.99.31`: crontab, systemd timers, the backup script and its journal, `~/backups`, `rclone lsd/size`). Nothing was changed. The VPS side (Medusa, Payload, Cal.com, n8n databases on 169.239.180.49, `infra/scripts/backup.sh`) is out of scope here except where noted.

## 1. What backs up the member database today

| Item | Finding |
|---|---|
| Scheduler | No crontab for `aimate` or root. A **systemd user timer** `supabase-backup.timer` (in `~/.config/systemd/user/`) runs daily at **02:30 SAST** plus up to 10 min random delay, `Persistent=true`. Last run 25 Nov 02:37:52, next 26 Nov 02:35 |
| Script | `~/supabase-selfhost/backup/backup-all.sh` (unit `supabase-backup.service`) |
| What it dumps | `pg_dump -Fc` of **every** database on `supabase-postgres` except `postgres`: leads, sa_shooting, vaultwarden, keytap, vibe, vibestream, **suzanne**. A whole-database dump, so the `auth`, `storage` and `public` schemas are all in it. Checked on the 25 Nov dump: it holds TABLE DATA for `auth.users`, `storage.objects`, `storage.buckets`, `public.member_subscriptions`, `public.novice_applications`, `public.novice_application_events`, `public.quiz_subscribers` |
| Local copy | `~/backups/YYYY-MM-DD/<db>.dump`. Folders 2026-11-01 to 2026-11-25 are present (25 nights). The 25 Nov `suzanne.dump` is 599,080 bytes. `~/backups` is 369 MB; disk `/` 27% used (113 GB free) |
| Off-box copy | `rclone copy` to `b2:aimate-supabase-backups/<date>` (rclone remote `b2`, configured in the aimate user's rclone config) |
| Storage files | After the dumps, `rclone sync` of each `~/apps/<app>/storage-data` to `b2:aimate-supabase-backups/storage-current/<app>`: one mirror, no history, and **without the xattrs** (content-type, cache-control) that storage-api needs on restore (the script's own comment says so) |
| Local retention | `find ~/backups -maxdepth 1 -mtime +3 -exec rm -rf` at the end of the script |
| Other copies | Ad hoc: `~/backups/suzanne/suzanne-pre-membership-levels-20261120.dump`, `~/backups/suzanne-pre-unsub-20260819.dump`, `~/suzanne-public.dump` and `~/suzanne-auth.dump` (23 Jul migration) |
| Restore drill | Once, 22 Jul 2026 (testapp), procedure in `~/supabase-selfhost/README.md` "Restore procedure (VALIDATED ...)". None since for suzanne |

## 2. The gap

1. **Nothing has left the box since 6 Nov.** Every run from 6 Nov to 25 Nov failed (20 nights; 25 failed runs in the journal since July): Backblaze answers `403 storage_cap_exceeded` ("Cannot upload files, storage cap exceeded. See the Caps & Alerts page to increase your cap"). The bucket holds 9.97 GiB (10.01 GiB with old versions), of which `storage-current/vibe` (videos) is 8.68 GiB and `storage-current/suzanne` 59 MiB. The last dated folder in B2 is `2026-11-06`. So the newest off-box copy of the member database is from 6 Nov, and the Novice application files (bucket `novice-applications`, first file 24 Nov) have never been copied off the box.
2. **No alert.** The unit fails silently (`systemctl --user` status only). Nobody was told for 20 days.
3. **Local retention is broken by the failure.** `set -e` stops the script at the failed `rclone copy`, so the 3-day prune never runs. That is why 25 local folders exist. Helpful by accident, but every copy is on the same disk as the database: a lost box loses both.
4. **Storage restore is weak.** The B2 storage copy is a mirror without xattrs and without history: a file deleted by mistake is deleted in B2 at the next sync, and a restore from it gives files storage-api cannot serve until the xattrs are rebuilt.
5. **No B2 retention rule** is visible: dated folders from July are still in the bucket, which is part of why it filled up.
6. **No restore test for suzanne** since the July drill on another app.
7. **The VPS backup** (`infra/scripts/backup.sh`) never included Supabase, and its cron state on the VPS is not verified (readiness report section 4). Out of scope here; Johan can check with `crontab -l | grep backup.sh` and `tail /var/log/suzanneravenall-backup.log` on the VPS.
8. Side finding: the box's SSH journal shows constant password guessing against root from the internet. If password login is on for SSH, turning it off (keys only) is worth a separate look. Not changed or tested here.

## 3. Proposal

### P1. Unblock the off-box copy (Johan, Backblaze account) - **needs Johan**, before go-live

Option A (minutes): Backblaze web console, Caps & Alerts, raise the storage cap (B2 storage costs about USD 6 per TB per month; 20 GB is cents). Option B: move the vibe videos out of this bucket (they are already on Bunny or their source); a separate decision for the Vibe project.

Then (us, with Johan's yes) one manual run and its read-back:

```bash
ssh -i ~/.ssh/aimate-db aimate@102.68.99.31
systemctl --user start supabase-backup.service
journalctl --user -u supabase-backup.service --since '-15 min' --no-pager | tail -20   # ends with "backup complete"
rclone lsf b2:aimate-supabase-backups/$(date +%F)/                                    # suzanne.dump listed
```

Note: once a run succeeds, the 3-day local prune works again and the folders older than 3 days in `~/backups` are deleted. Copy anything wanted from them first.

### P2. A dedicated daily job for the suzanne database and its files - **needs Johan's yes to install**

New script `~/supabase-selfhost/backup/backup-suzanne.sh` (proposed text; nothing installed yet):

```bash
#!/usr/bin/env bash
# Daily backup of the suzanneravenall.com member database and its Storage files.
# Full DB dump (public + auth + storage schemas) and a tar WITH xattrs of the
# storage files, kept locally 14 days and copied to B2 under suzanne/daily
# (30 days) and suzanne/monthly (12 months). Alerts through Uptime Kuma.
set -euo pipefail

APP=suzanne
PG_CONTAINER=supabase-postgres
B2_REMOTE="${B2_REMOTE:-b2}"
B2_BUCKET="${B2_BUCKET:-aimate-supabase-backups}"
KEEP_LOCAL_DAYS=14
DATE=$(date +%F); MONTH=$(date +%Y-%m)
DIR="$HOME/backups/$APP/daily/$DATE"
[ -f "$HOME/.config/suzanne-backup.env" ] && . "$HOME/.config/suzanne-backup.env"   # BACKUP_PUSH_URL (Uptime Kuma push)

fail() { [ -n "${BACKUP_PUSH_URL:-}" ] && curl -fsS -m 10 "${BACKUP_PUSH_URL}?status=down&msg=$(printf %s "$1" | tr ' ' '+')" >/dev/null || true; echo "FAIL: $1" >&2; exit 1; }
trap 'fail "line $LINENO"' ERR

mkdir -p "$DIR"
docker exec "$PG_CONTAINER" pg_dump -U supabase_admin -Fc "$APP" > "$DIR/$APP.dump"
docker exec "$PG_CONTAINER" pg_dump -U supabase_admin -Fc --schema=auth "$APP" > "$DIR/$APP-auth.dump"
sudo -n tar --xattrs --xattrs-include='*' -czf "$DIR/$APP-storage.tgz" -C "$HOME/apps/$APP/storage-data" .
sudo -n chown "$(id -u):$(id -g)" "$DIR/$APP-storage.tgz"

# Sanity: the dump must list the member tables before it counts as a backup
n=$(docker exec -i "$PG_CONTAINER" pg_restore -l < "$DIR/$APP.dump" | grep -cE 'TABLE DATA (auth users|public member_subscriptions|public novice_applications|storage objects)')
[ "$n" -eq 4 ] || fail "dump incomplete ($n of 4 tables)"
sha256sum "$DIR"/* > "$DIR/SHA256SUMS"

rclone copy "$DIR" "$B2_REMOTE:$B2_BUCKET/$APP/daily/$DATE" --transfers 4
if [ "$(date +%d)" = "01" ]; then
  rclone copy "$DIR" "$B2_REMOTE:$B2_BUCKET/$APP/monthly/$MONTH" --transfers 4
fi

# Retention: B2 daily 30 days, monthly 12 months (hard delete, no hidden versions), local 14 days
rclone delete "$B2_REMOTE:$B2_BUCKET/$APP/daily" --min-age 30d --b2-hard-delete
rclone delete "$B2_REMOTE:$B2_BUCKET/$APP/monthly" --min-age 365d --b2-hard-delete
rclone rmdirs "$B2_REMOTE:$B2_BUCKET/$APP" --leave-root
find "$HOME/backups/$APP/daily" -mindepth 1 -maxdepth 1 -type d -mtime +"$KEEP_LOCAL_DAYS" -exec rm -rf {} +

[ -n "${BACKUP_PUSH_URL:-}" ] && curl -fsS -m 10 "${BACKUP_PUSH_URL}?status=up&msg=OK" >/dev/null || true
echo "backup complete: $DIR"
```

Units (user systemd, same pattern as the existing job), 01:15 SAST so it never overlaps the 02:30 job:

```ini
# ~/.config/systemd/user/suzanne-backup.service
[Unit]
Description=Daily suzanne DB + Storage backup to Backblaze B2

[Service]
Type=oneshot
ExecStart=/usr/bin/bash %h/supabase-selfhost/backup/backup-suzanne.sh

# ~/.config/systemd/user/suzanne-backup.timer
[Unit]
Description=Daily suzanne backup at 01:15 SAST

[Timer]
OnCalendar=*-*-* 01:15:00
Persistent=true

[Install]
WantedBy=timers.target
```

Install (us, after Johan's yes):

```bash
chmod +x ~/supabase-selfhost/backup/backup-suzanne.sh
systemctl --user daemon-reload
systemctl --user enable --now suzanne-backup.timer
systemctl --user list-timers --all | grep suzanne-backup
systemctl --user start suzanne-backup.service
journalctl --user -u suzanne-backup.service --since '-10 min' --no-pager | tail
rclone lsf b2:aimate-supabase-backups/suzanne/daily/$(date +%F)/   # suzanne.dump, suzanne-auth.dump, suzanne-storage.tgz, SHA256SUMS
```

Rollback: `systemctl --user disable --now suzanne-backup.timer` and remove the two unit files.

Launch week option: run it every 6 hours (`OnCalendar=*-*-* 01,07,13,19:15:00`) until the first week of real orders and members is over, then back to daily.

**Names of what it needs** (no values written anywhere in the repo):

| Name | What | Where it lives |
|---|---|---|
| rclone remote `b2` | B2 account id + application key | already configured in the aimate user's rclone config on aimate-db1 (works: the `lsd` and `size` reads above succeeded) |
| `B2_BUCKET` | bucket, default `aimate-supabase-backups` | script default |
| `B2_REMOTE` | rclone remote name, default `b2` | script default |
| `BACKUP_PUSH_URL` | Uptime Kuma push monitor URL (the token in it is a secret) | `~/.config/suzanne-backup.env`, mode 600; create the push monitor in Uptime Kuma on aimate-db1 (heartbeat 26 h) - Johan |
| For the VPS script's B2 CLI, if Johan prefers it to rclone | `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME` | as named in `infra/scripts/backup.sh` |

Decisions for Johan in P2:
- **Encryption.** The dumps hold members' names, emails, password hashes and Novice documents (POPIA). Either turn on B2 server-side encryption (SSE-B2) for the bucket (Bucket Settings, one click) or wrap the remote in an rclone `crypt` remote (stronger; the passphrase must then live in Vaultwarden, or the backups are unreadable). Recommended: SSE-B2 now, crypt later.
- **Separate bucket and key** for Suzanne (an application key limited to one bucket) so a Vibe problem cannot fill or break her backups again. Creating the key is Johan's step in the Backblaze console.
- **The existing all-apps job** keeps running and also copies suzanne. Once P2 runs, the suzanne line in it is a second copy, which is fine.

### P3. One restore test on a scratch database (us, with Johan's yes) - after P2's first run

Follows the validated drill in `~/supabase-selfhost/README.md`, on a new database `suzanne_restore_test`, so the live `suzanne` database and its containers are never touched.

```bash
ssh -i ~/.ssh/aimate-db aimate@102.68.99.31
F=~/backups/suzanne/daily/$(date +%F)/suzanne.dump     # or any dated dump

# 1. Scratch database with the same DB-level grants (they are not in a dump)
docker exec supabase-postgres psql -U supabase_admin -d postgres -c 'CREATE DATABASE suzanne_restore_test;'
docker exec supabase-postgres psql -U supabase_admin -d suzanne_restore_test -c "
  REVOKE CONNECT ON DATABASE suzanne_restore_test FROM PUBLIC;
  GRANT CONNECT ON DATABASE suzanne_restore_test TO suzanne_authenticator, suzanne_auth_admin, suzanne_storage_admin;
  GRANT CREATE  ON DATABASE suzanne_restore_test TO suzanne_auth_admin, suzanne_storage_admin;"

# 2. Restore WITH ownership (no --no-owner)
docker exec -i supabase-postgres pg_restore -U supabase_admin -d suzanne_restore_test < "$F" 2> /tmp/restore-test.log; echo "exit $?"
grep -c ERROR /tmp/restore-test.log

# 3. Compare row counts, live against restored
for db in suzanne suzanne_restore_test; do
  echo "== $db"
  docker exec -i supabase-postgres psql -U supabase_admin -d "$db" -At <<'SQL'
select 'auth.users '||count(*) from auth.users;
select 'member_subscriptions '||count(*) from public.member_subscriptions;
select 'novice_applications '||count(*) from public.novice_applications;
select 'novice_application_events '||count(*) from public.novice_application_events;
select 'quiz_subscribers '||count(*) from public.quiz_subscribers;
select 'leads '||count(*) from public.leads;
select 'storage.objects '||count(*) from storage.objects;
SQL
done

# 4. Storage files: unpack to a scratch folder and check xattrs survived
mkdir -p /tmp/suzanne-storage-test
sudo tar --xattrs --xattrs-include='*' -xzf "${F%/*}/suzanne-storage.tgz" -C /tmp/suzanne-storage-test
sudo find /tmp/suzanne-storage-test -type f | wc -l
sudo getfattr -d "$(sudo find /tmp/suzanne-storage-test/local/suzanne/invoices -type f | head -1)" | grep -c 'user.supabase.content-type'   # 1

# 5. Clean up the scratch copies
docker exec supabase-postgres psql -U supabase_admin -d postgres -c 'DROP DATABASE suzanne_restore_test;'
sudo rm -rf /tmp/suzanne-storage-test /tmp/restore-test.log
```

Pass: step 2 has no ERROR lines (or only the known harmless ones, which we list in the result), step 3 counts are equal (live may be ahead by rows written in between), step 4 finds the files with their `user.supabase.*` xattrs. Write the result into this file's results section and into the README of `~/supabase-selfhost`. Then repeat the test once a quarter.

## 4. What Johan must run or approve

| # | Item | Who | When |
|---|---|---|---|
| 1 | Raise the B2 cap (or move the vibe videos out) | Johan, Backblaze console | Thursday, before go-live |
| 2 | Yes to the manual run of the existing job (P1) | Johan's yes, we run | after 1 |
| 3 | Yes to installing P2 (script + timer) | Johan's yes, we install | Thursday |
| 4 | Encryption choice (SSE-B2 or crypt) and whether to use a separate bucket and key | Johan | before 3 |
| 5 | Uptime Kuma push monitor and its URL in `~/.config/suzanne-backup.env` | Johan creates, we place | with 3 |
| 6 | Yes to the restore test (P3) | Johan's yes, we run | after the first P2 run |
| 7 | The pre-go-live dump and storage tar (A9 step T1) copied to his PC | Johan's yes, we run | Thursday |
| 8 | Check the VPS cron for `infra/scripts/backup.sh` | Johan, on the VPS | this week |

## 5. Results

(empty: filled in when P1 to P3 run)
