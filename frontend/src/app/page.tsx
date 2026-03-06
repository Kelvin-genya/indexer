import UrlSubmitForm from '@/components/url-submit-form'

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit URLs for Indexing</h1>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <UrlSubmitForm />
      </div>
    </div>
  )
}
