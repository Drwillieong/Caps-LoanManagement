import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { faqSections } from './Faq';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Head } from '@inertiajs/react';

type Props = {
  slug: string;
};

export default function FaqDetail({ slug }: Props) {
  const section = faqSections.find((s) => s.slug === slug);
  const Icon = section?.icon;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Head title={section ? `${section.title} — FAQ` : 'FAQ'} />

      {/* HEADER */}
      <div className="border-b border-green-100 bg-gradient-to-br from-green-50 via-white to-emerald-50 px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2 text-green-700 hover:bg-green-100/50 hover:text-green-800"
            asChild
          >
            <Link href="/faq">
              <ArrowLeft className="mr-1 size-4" />
              Back to FAQ
            </Link>
          </Button>

          {section && Icon && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <Icon className="size-5" />
              </div>
              <h2 className="text-2xl font-bold text-green-900">
                {section.title}
              </h2>
            </div>
          )}

          {!section && (
            <h2 className="text-2xl font-bold text-green-900">FAQ Not Found</h2>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <ScrollArea className="h-full flex-1">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {section ? (
            <div className="rounded-2xl border border-green-100 bg-green-50/40 p-6 shadow-sm">
              <p className="text-sm leading-7 text-slate-600">
                {section.answer}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-green-100 bg-green-50/40 p-6 shadow-sm">
              <p className="text-sm leading-7 text-slate-600">
                The FAQ item you are looking for does not exist. Please go back
                and select a different question.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/faq">Back to FAQ</Link>
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

