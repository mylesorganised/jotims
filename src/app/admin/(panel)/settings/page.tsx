import type { Metadata } from "next";
import { Database, HardDrive } from "lucide-react";
import { SettingsForm } from "@/components/admin/scout-forms";
import { Callout, Card, PageTitle } from "@/components/ui";
import { requireLeader } from "@/lib/auth";
import { databaseMode } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { uploadMode } from "@/lib/uploads";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireLeader();
  const settings = await getSettings();
  const db = databaseMode();
  const files = uploadMode();

  return (
    <div className="space-y-8">
      <PageTitle title="Settings" />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-extrabold">Logging in</h2>
          <SettingsForm settings={settings} />
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-3 text-lg font-extrabold">Where things are stored</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex gap-3">
                <Database className="mt-0.5 size-5 text-brand-500" />
                <div>
                  <dt className="font-bold">Database</dt>
                  <dd className="text-muted">
                    {db === "postgres" ? "Postgres (DATABASE_URL)" : "Local database in the .data folder (development)"}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <HardDrive className="mt-0.5 size-5 text-brand-500" />
                <div>
                  <dt className="font-bold">Uploaded evidence</dt>
                  <dd className="text-muted">
                    {files === "blob"
                      ? "Vercel Blob"
                      : files === "local"
                        ? "Local files in .data/uploads (development)"
                        : "Switched off: connect a Vercel Blob store to allow uploads"}
                  </dd>
                </div>
              </div>
            </dl>
          </Card>
          {files === "none" && (
            <Callout tone="warning" title="Uploads are switched off">
              In Vercel, open your project, go to Storage and connect a Blob store. That adds BLOB_READ_WRITE_TOKEN. Then redeploy.
            </Callout>
          )}
        </div>
      </div>
    </div>
  );
}
