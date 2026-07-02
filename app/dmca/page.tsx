import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Scale, AlertTriangle, ArrowRight, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "DMCA - PrimerTv",
  description:
    "Legal Disclaimer and DMCA Notice of Copyright Infringement for PrimerTv.",
};

export default function DmcaPage() {
  const steps = [
    {
      num: "1",
      title: "Specific Identification of Work",
      desc: "Specific identification of the copyrighted work which you are alleging to have been infringed. If you are alleging infringement of multiple copyrighted works with a single notification you must submit a representative list which specifically identifies each of the works that you allege are being infringed.",
    },
    {
      num: "2",
      title: "Specific Location & URL",
      desc: "Specific identification of the location and description of the material that is claimed to be infringing or to be the subject of infringing activity with enough detailed information to permit us to locate the material. You should include the specific URL or URLs of the web pages where the allegedly infringing material is located.",
    },
    {
      num: "3",
      title: "Contact Details",
      desc: "Information reasonably sufficient to allow us to contact the complaining party which may include a name, address, telephone number and electronic mail address and signature at which the complaining party may be contacted.",
    },
    {
      num: "4",
      title: "Good Faith Belief Statement",
      desc: "A statement that the complaining party has a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent or the law.",
    },
    {
      num: "5",
      title: "Accuracy & Perjury Statement",
      desc: "A statement that the information in the notification is accurate, and under penalty of perjury that the complaining party is authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-800 dark:text-zinc-300 pb-20">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none overflow-hidden opacity-50 dark:opacity-30">
        <div className="absolute top-[-10%] left-[20%] w-[35%] h-[60%] rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 blur-3xl" />
        <div className="absolute top-[-5%] right-[20%] w-[35%] h-[60%] rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 pt-16 sm:px-6 lg:px-8">
        {/* Header Hero */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30 backdrop-blur-md">
            <Shield size={12} className="animate-pulse" />
            <span>Legal Policy</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-950 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            DMCA & Disclaimer
          </h1>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
            Please read our Legal Disclaimer and DMCA Copyright Infringement
            notice below.
          </p>
        </div>

        {/* Content Stack */}
        <div className="space-y-12">
          {/* Section 1: Legal Disclaimer */}
          <section className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700/80">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20">
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Legal Disclaimer
              </h2>
            </div>

            <div className="space-y-6 text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              <p>
                The author is not responsible for any contents linked or
                referred to from his pages - If any damage occurs by the use of
                information presented there, only the author of the respective
                pages might be liable, not the one who has linked to these
                pages.{" "}
                <span className="font-semibold text-zinc-950 dark:text-white">
                  primertv.vercel.app doesn&apos;t host any content.
                </span>
              </p>

              <div className="p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 italic text-sm">
                All primertv does is link or embed content that was uploaded to
                popular Online Video hosting sites like Youtube.com / Google
                Video. All youtube/googlevideo users signed a contract with the
                sites when they set up their accounts which forces them not to
                upload illegal content. By clicking on any Links to videos while
                surfing on{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  primertv
                </span>{" "}
                you watch content hosted on third parties and{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-350">
                  primertv
                </span>{" "}
                can&apos;t take the responsibility for any content hosted on
                other sites.
              </div>

              <p>
                We do not upload any videos nor do we know who and where videos
                are coming from. We do not promote any illegal conduct of any
                kind. Links to the videos are submitted by users and managed by
                users.
              </p>
            </div>
          </section>

          {/* Section 2: DMCA Copyright Infringement */}
          <section className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700/80">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20">
                <Scale size={20} />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                DMCA Notice of Copyright Infringement
              </h2>
            </div>

            <div className="space-y-6 text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300 mb-8">
              <p>
                <span className="font-medium text-zinc-950 dark:text-white">
                  primertv
                </span>{" "}
                is an online service provider as defined in the Digital
                Millennium Copyright Act.
              </p>
              <p>
                We take copyright violation very seriously and will vigorously
                protect the rights of legal copyright owners. If you are the
                copyright owner of content which appears on the{" "}
                <span className="font-medium text-zinc-950 dark:text-white">
                  primertv
                </span>{" "}
                website and you did not authorize the use of the content you
                must notify us in writing in order for us to identify the
                allegedly infringing content and take action.
              </p>
              <p>
                We will be unable to take any action if you do not provide us
                with the required information, so please fill out all fields
                accurately and completely. You may make a written notice via the
                contact form as listed below. Your written notice must include
                the following:
              </p>
            </div>

            {/* Requirement Steps */}
            <div className="grid grid-cols-1 gap-4 mb-8">
              {steps.map((step) => (
                <div
                  key={step.num}
                  className="group relative flex flex-col sm:flex-row gap-4 p-5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-all duration-200"
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20">
                    {step.num}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                      {step.title}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Alert / Action Link */}
            <div className="p-5 rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10/5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Mail
                    className="text-blue-500 dark:text-blue-400 flex-shrink-0"
                    size={20}
                  />
                  <span>
                    Written notice should be sent to our designated agent in the{" "}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      contact page
                    </span>
                    .
                  </span>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-750 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Contact Page
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
