import { useState } from 'react'
import { Link } from 'react-router-dom'

const pageSectionClass = 'mb-4'
const headingClass = 'text-bunker-green font-bold text-base mb-2 mt-4 first:mt-0'
const pClass = 'text-gray-300 text-xs leading-relaxed mb-2'
const listClass = 'list-disc pl-5 text-gray-300 text-xs space-y-0.5 mb-2'

function PageContent({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 min-h-0 overflow-hidden flex flex-col">{children}</div>
}

const PAGES: React.ReactNode[] = [
  (
    <PageContent key="p1">
      <section className={pageSectionClass}>
        <p className={pClass}>
          This Privacy Policy (&quot;Policy&quot;) applies to HoldorFold.com and Vector Dayton LLC (&quot;Company&quot;) and governs data collection and usage. For the purposes of this Privacy Policy, unless otherwise noted, all references to the Company include HoldorFold.com. The Company&apos;s website is an interactive online platform and social gaming community that provides users with access to digital content, virtual account management, and community engagement features. By using the Company website, you consent to the data practices described in this statement.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>California Consumer Privacy Act and California Privacy Rights Act</h2>
        <p className={pClass}>
          If you are a California resident, you have the following rights under the California Consumer Privacy Act (&quot;CCPA&quot;) and California Privacy Rights Act (&quot;CPRA&quot;):
        </p>
        <ul className={listClass}>
          <li><strong>Right to Know.</strong> You may request details on what personal data we collect, use, and share.</li>
          <li><strong>Right to Delete.</strong> You can request deletion of personal data, subject to certain legal exceptions.</li>
          <li><strong>Right to Correct.</strong> You may request corrections to inaccurate personal information.</li>
          <li><strong>Right to Opt-Out.</strong> You can opt out of the sale or sharing of personal data for advertising.</li>
          <li><strong>Right to Restrict Sensitive Data Use.</strong> You may limit the use of sensitive personal information.</li>
          <li><strong>Right Against Retaliation.</strong> The Company will not discriminate against you for exercising your rights.</li>
        </ul>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Collection of Your Personal Information</h2>
        <p className={pClass}>
          In order to better provide you with products and services offered, the Company may collect personally identifiable information, such as your:
        </p>
        <ul className={listClass}>
          <li>Email address</li>
          <li>Usernames, account passwords, and game-play statistics</li>
        </ul>
        <p className={pClass}>
          If you purchase the Company&apos;s products and services, we collect billing and credit card information. This information is used to complete the purchase transaction.
        </p>
        <p className={pClass}>
          Please keep in mind that if you directly disclose personally identifiable information or personally sensitive data through the Company&apos;s public message boards, this information may be collected and used by others.
        </p>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="p2">
      <section className={pageSectionClass}>
        <p className={pClass}>
          We do not collect any personal information about you unless you voluntarily provide it to us. However, you may be required to provide certain personal information to us when you elect to use certain products or services. These may include: (a) registering for an account; (b) entering a sweepstakes or contest sponsored by us or one of our partners; (c) signing up for special offers from selected third parties; (d) sending us an email message; (e) submitting your credit card or other payment information when ordering and purchasing products and services. To wit, we will use your information for, but not limited to, communicating with you in relation to services and/or products you have requested from us. We also may gather additional personal or non-personal information in the future.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Use of Your Personal Information</h2>
        <p className={pClass}>The Company collects and uses your personal information in the following ways:</p>
        <ul className={listClass}>
          <li>To operate and deliver the services you have requested</li>
          <li>To provide you with information, products, or services that you request from us</li>
          <li>To provide you with notices about your account</li>
          <li>To carry out the Company&apos;s obligations and enforce our rights arising from any contracts entered between you and us, including for billing and collection</li>
          <li>To notify you about changes to HoldorFold.com or any products or services we offer or provide through it</li>
          <li>In any other way we may describe when you provide the information</li>
          <li>For any other purpose with your consent</li>
        </ul>
        <p className={pClass}>
          The Company may also use your personally identifiable information to inform you of other products or services available from the Company and its affiliates.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Sharing Information with Third Parties</h2>
        <p className={pClass}>
          The Company does not sell, rent, or lease its customer lists to third parties.
        </p>
        <p className={pClass}>
          The Company may share data with trusted partners to help perform statistical analysis, send you email or postal mail, provide customer support, or arrange for deliveries. All such third parties are prohibited from using your personal information except to provide these services to the Company, and they are required to maintain the confidentiality of your information.
        </p>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="p3">
      <section className={pageSectionClass}>
        <p className={pClass}>
          The Company may disclose your personal information, without notice, if required to do so by law or in the good faith belief that such action is necessary to: (a) conform to the edicts of the law or comply with legal process served on the Company or the site; (b) protect and defend the rights or property of the Company; and/or (c) act under exigent circumstances to protect the personal safety of users of the Company, or the public.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Tracking User Behavior</h2>
        <p className={pClass}>
          The Company may keep track of the websites and pages our users visit within the Company, in order to determine what the Company services are the most popular. This data is used to deliver customized content and advertising within the Company to customers whose behavior indicates that they are interested in a particular subject area.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Automatically Collected Information</h2>
        <p className={pClass}>
          The Company may automatically collect information about your computer hardware and software. This information can include your IP address, browser type, domain names, access times, and referring website addresses. This information is used for the operation of the service, to maintain quality of the service, and to provide general statistics regarding the use of the Company&apos;s website.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Use of Cookies</h2>
        <p className={pClass}>
          The Company&apos;s website may use &quot;cookies&quot; to help you personalize your online experience. A cookie is a text file that is placed on your hard disk by a web page server. Cookies cannot be used to run programs or deliver viruses to your computer. Cookies are uniquely assigned to you, and can only be read by a web server in the domain that issued the cookie to you.
        </p>
        <p className={pClass}>
          One of the primary purposes of cookies is to provide a convenience feature to save you time. The purpose of a cookie is to tell the web server that you have returned to a specific page.
        </p>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="p4">
      <section className={pageSectionClass}>
        <p className={pClass}>
          You have the ability to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser settings to decline cookies if you prefer. If you choose to decline cookies, you may not be able to fully experience the interactive features of the Company&apos;s services or websites you visit.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Links</h2>
        <p className={pClass}>
          This website contains links to other sites. Please be aware that we are not responsible for the content or privacy practices of such other sites. We encourage our users to be aware when they leave our site and to read the privacy statements of any other site that collects personally identifiable information.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Security of Your Personal Information</h2>
        <p className={pClass}>
          The Company secures your personal information from unauthorized access, use, or disclosure. The Company uses the following methods for this purpose:
        </p>
        <ul className={listClass}>
          <li>SSL Protocol</li>
          <li>Secure Data Encryption, Secure Cloud Hosting, Third-Party Payment Gateways, Internal Access Controls</li>
        </ul>
        <p className={pClass}>
          When personal information (such as a credit card number) is transmitted to other websites, it is protected through the use of encryption, such as the Secure Sockets Layer (SSL) protocol.
        </p>
        <p className={pClass}>
          We strive to take appropriate security measures to protect against unauthorized access to or alteration of your personal information. Unfortunately, no data transmission over the Internet or any wireless network can be guaranteed to be 100% secure.
        </p>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="p5">
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Right to Deletion</h2>
        <p className={pClass}>
          Subject to certain exceptions set out below, on receipt of a verifiable request from you, we will delete your personal information from our records and direct any service providers to delete your personal information from their records.
        </p>
        <p className={pClass}>
          Under the CCPA and CPRA, you have the right to request that the Company, and any third parties with whom your personal information is sold or shared, delete any personal information that has been collected about you. To exercise your rights, contact us at HoldorFoldGame@gmail.com.
        </p>
        <p className={pClass}>
          Please note that we may not be able to comply with requests to delete your personal information if it is necessary to:
        </p>
        <ul className={listClass}>
          <li>Complete the transaction for which the personal information was collected, fulfill the terms of a written warranty or product recall conducted in accordance with federal law, and provide a good or service requested by you, or reasonably anticipated within the context of our ongoing business relationship with you, or otherwise perform a contract between you and us;</li>
          <li>Detect security incidents, protect against malicious, deceptive, fraudulent, or illegal activity; or prosecute those responsible for that activity;</li>
          <li>Debug to identify and repair errors that impair existing intended functionality;</li>
          <li>Exercise free speech, ensure the right of another consumer to exercise his or her right of free speech, or exercise another right provided for by law;</li>
          <li>Comply with the California Electronic Communications Privacy Act;</li>
          <li>Engage in public or peer-reviewed scientific, historical, or statistical research in the public interest that adheres to all other applicable ethics and privacy laws, when our deletion of the information is likely to render impossible or seriously impair the achievement of such research, provided we have obtained your informed consent;</li>
          <li>Enable solely internal uses that are reasonably aligned with your expectations based on your relationship with us;</li>
          <li>Comply with an existing legal obligation; or</li>
          <li>Otherwise use your personal information, internally, in a lawful manner that is compatible with the context in which you provided the information.</li>
        </ul>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="p6">
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Children Under Thirteen</h2>
        <p className={pClass}>
          The Company does not knowingly collect personally identifiable information from children under the age of 13. If you are under the age of 13, you must ask your parent or guardian for permission to use this website.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Disconnecting Your Company Account from Third Party Websites</h2>
        <p className={pClass}>
          You will be able to connect your Company&apos;s account to third-party accounts. BY CONNECTING YOUR COMPANY&apos;S ACCOUNT TO YOUR THIRD-PARTY ACCOUNT, YOU ACKNOWLEDGE AND AGREE THAT YOU ARE CONSENTING TO THE CONTINUOUS RELEASE OF INFORMATION ABOUT YOU TO OTHERS (IN ACCORDANCE WITH YOUR PRIVACY SETTINGS ON THOSE THIRD-PARTY SITES). IF YOU DO NOT WANT INFORMATION ABOUT YOU, INCLUDING PERSONALLY IDENTIFYING INFORMATION, TO BE SHARED IN THIS MANNER, DO NOT USE THIS FEATURE. You may disconnect your account from a third-party account at any time.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Email Communications</h2>
        <p className={pClass}>
          From time to time, the Company may contact you via email for the purpose of providing announcements, promotional offers, alerts, confirmations, surveys, and/or other general communication. In order to improve our services, we may receive a notification when you open an email from the Company or click on a link therein.
        </p>
        <p className={pClass}>
          If you would like to stop receiving marketing or promotional communications via email from the Company, you may opt out of such communications by clicking on the &apos;unsubscribe&apos; link at the bottom of our emails or by contacting us directly at support@holdorfold.com.
        </p>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="p7">
      <section className={pageSectionClass}>
        <h2 className={headingClass}>External Data Storage Sites</h2>
        <p className={pClass}>
          We may store your data on servers provided by third-party hosting vendors with whom we have contracted.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Changes to This Statement</h2>
        <p className={pClass}>
          The Company reserves the right to change this Policy from time to time. For example, when there are changes in our services, changes in our data protection practices, or changes in the law. When changes to this Policy are significant, we will inform you. You may receive a notice by sending an email to the primary email address specified in your account, by placing a prominent notice on our website, and/or by updating any privacy information. Your continued use of the website and/or services available after such modifications will constitute your: (a) acknowledgment of the modified Policy; and (b) agreement to abide and be bound by that Policy.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Contact Information</h2>
        <p className={pClass}>
          <strong>Vector Dayton LLC</strong><br />
          Email Address: info@holdorfold.com
        </p>
      </section>
    </PageContent>
  ),
]

const TOTAL_PAGES = PAGES.length

export default function Privacy() {
  const [page, setPage] = useState(0)
  const canPrev = page > 0
  const canNext = page < TOTAL_PAGES - 1

  return (
    <div className="min-h-full w-full font-mono flex flex-col lg:p-6 max-w-4xl mx-auto">
      <div className="glass-green rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-2 border-b glass-divider">
          <h1 className="text-xl sm:text-2xl font-bold text-bunker-green">Privacy Policy</h1>
          <p className="text-white/50 text-[10px] sm:text-xs">Effective as of January 1, 2026</p>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden px-4 sm:px-6 py-3">
          {PAGES[page]}
        </div>

        <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-t glass-divider flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!canPrev}
              className="glass-card px-3 py-1.5 rounded-xl border border-bunker-green/40 text-bunker-green text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bunker-green/10 transition"
            >
              ← Previous
            </button>
            <span className="text-white/60 text-xs font-mono">
              Page {page + 1} of {TOTAL_PAGES}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(TOTAL_PAGES - 1, p + 1))}
              disabled={!canNext}
              className="glass-card px-3 py-1.5 rounded-xl border border-bunker-green/40 text-bunker-green text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bunker-green/10 transition"
            >
              Next →
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Link to="/about" className="text-bunker-green hover:underline">← About</Link>
            <span className="text-white/40">|</span>
            <Link to="/support" className="text-bunker-green hover:underline">Support</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
