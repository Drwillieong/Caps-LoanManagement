import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { login } from '@/routes';
import {
  ArrowDownToLine,
  ArrowLeft,
  Banknote,
  Building2,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type FaqSection = {
  title: string;
  slug: string;
  answer: string;
  icon: LucideIcon;
};

export const faqSections: FaqSection[] = [
  {
    slug: 'questions-about-my-loan',
    title: 'Questions About My Loan',
    answer:
      'Check your dashboard to review your loan amount,  due dates, and account status. If any detail looks incorrect, contact the loan management team for assistance.',
    icon: FileText,
  },
  {
    slug: 'cant-log-in-or-technical-issues',
    title: "I Can't Log In or Other Technical Issues",
    answer:
      'Verify that you are using the correct email and password, then try again. If the problem continues, use the forgot password option or contact support for account recovery.',
    icon: ShieldAlert,
  },
  
  
  
  
  {
    slug: 'applying-for-a-loan',
    title: 'Applying for a Loan',
    answer:
      'Prepare your personal and financial details before starting your application. Complete all required fields accurately so your request can be reviewed without unnecessary delays.',
    icon: ClipboardList,
  },
  {
    slug: 'general-information-about-leimco',
    title: 'General Information about LEIMCO',
    answer:
      'LEIMCO provides a loan management system that supports loan applications, approval review, disbursement tracking, and repayment monitoring in one place.',
    icon: Building2,
  },
];

type FaqProps = {
  className?: string;
};

export default function Faq({ className }: FaqProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-white', className)}>
      {/* HEADER */}
      <div className="border-b border-green-100 bg-gradient-to-br from-green-50 via-white to-emerald-50 px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2 text-green-700 hover:bg-green-100/50 hover:text-green-800"
            asChild
          >
            <Link href={login()}>
              <ArrowLeft className="mr-1 size-4" />
              Back to Login
            </Link>
          </Button>

         
          <h2 className="text-3xl font-bold text-green-900">Loan FAQ</h2>
          <p className="mt-2 text-sm leading-6 text-green-700/80">
            Quick answers about your loan, repayment, login access, and common
            support concerns.
          </p>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <ScrollArea className="h-full flex-1">
  <div className="mx-auto max-w-6xl px-6 py-8">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {faqSections.map((section) => {
        const Icon = section.icon;

        return (
          <Link
            key={section.slug}
            href={`/faq/${section.slug}`}
            className="block rounded-2xl border border-green-100 bg-green-50/40 p-4 shadow-sm transition-colors hover:bg-green-100/60"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                <Icon className="size-4" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-green-900">
                  {section.title}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {section.answer}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  </div>
</ScrollArea>
    </div>
  );
}
