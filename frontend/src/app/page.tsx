import UrlSubmitForm from '@/components/url-submit-form'

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submit URLs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste URLs below to submit them for indexing via Google and IndexNow.
        </p>
      </div>
      <UrlSubmitForm />
    </div>
  )
}
