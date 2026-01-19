'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OrganizationEmailSettings } from '@/lib/db/schema';

interface EmailSettingsFormProps {
  settings: OrganizationEmailSettings | null;
  organizationId: string;
}

const providers = [
  { value: 'resend', label: 'Resend' },
  { value: 'sendgrid', label: 'SendGrid' },
  { value: 'postmark', label: 'Postmark' },
  { value: 'ses', label: 'Amazon SES' },
];

export function EmailSettingsForm({ settings, organizationId }: EmailSettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fromName, setFromName] = useState(settings?.fromName || '');
  const [fromEmail, setFromEmail] = useState(settings?.fromEmail || '');
  const [replyToEmail, setReplyToEmail] = useState(settings?.replyToEmail || '');
  const [provider, setProvider] = useState<string>(settings?.provider || 'resend');
  const [providerApiKey, setProviderApiKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/email-settings', {
        method: settings ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromName,
          fromEmail,
          replyToEmail: replyToEmail || null,
          provider,
          providerApiKey: providerApiKey || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to save email settings');
        return;
      }

      setSuccess(true);
      setProviderApiKey('');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure how emails are sent from your organization
              </CardDescription>
            </div>
            {settings && (
              <Badge
                variant={settings.isVerified ? 'default' : 'secondary'}
                className="flex items-center gap-1"
              >
                {settings.isVerified ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    Not Verified
                  </>
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                Email settings saved successfully.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Acme Inc."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The name that will appear in the From field
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="noreply@acme.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must be a verified email address
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="replyToEmail">Reply-To Email (Optional)</Label>
              <Input
                id="replyToEmail"
                type="email"
                value={replyToEmail}
                onChange={(e) => setReplyToEmail(e.target.value)}
                placeholder="support@acme.com"
              />
              <p className="text-xs text-muted-foreground">
                Where replies should be sent
              </p>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-4">Email Provider</h4>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="providerApiKey">
                    API Key {settings?.providerApiKey && '(Leave blank to keep existing)'}
                  </Label>
                  <Input
                    id="providerApiKey"
                    type="password"
                    value={providerApiKey}
                    onChange={(e) => setProviderApiKey(e.target.value)}
                    placeholder={settings?.providerApiKey ? '••••••••' : 'Enter API key'}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Email</CardTitle>
          <CardDescription>
            Send a test email to verify your configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TestEmailForm disabled={!settings?.isVerified} />
        </CardContent>
      </Card>
    </div>
  );
}

function TestEmailForm({ disabled }: { disabled: boolean }) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/email-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: 'Test email sent successfully!' });
      } else {
        setResult({ success: false, message: data.error || 'Failed to send test email' });
      }
    } catch {
      setResult({ success: false, message: 'An unexpected error occurred' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSendTest} className="space-y-4">
      {result && (
        <div
          className={`p-3 text-sm rounded-md ${
            result.success
              ? 'text-green-600 bg-green-50'
              : 'text-destructive bg-destructive/10'
          }`}
        >
          {result.message}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="test@example.com"
          required
          disabled={disabled}
        />
        <Button type="submit" disabled={disabled || isSending}>
          {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Test
        </Button>
      </div>

      {disabled && (
        <p className="text-xs text-muted-foreground">
          Save and verify your email settings to send test emails.
        </p>
      )}
    </form>
  );
}
