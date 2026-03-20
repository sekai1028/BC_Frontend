import { useState } from 'react'
import { Link } from 'react-router-dom'

const pageSectionClass = 'mb-4'
const headingClass = 'text-bunker-green font-bold text-base mb-2 mt-4 first:mt-0'
const pClass = 'text-gray-300 text-xs leading-relaxed mb-2'

function PageContent({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 min-h-0 overflow-hidden flex flex-col">{children}</div>
}

const PAGES: React.ReactNode[] = [
  (
    <PageContent key="t1">
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Agreement between User and HoldorFold.com</h2>
        <p className={pClass}>
          Welcome to HoldorFold.com. The HoldorFold.com website (the &quot;Site&quot;) is comprised of various web pages operated by Vector Dayton LLC (&quot;Vector Dayton LLC&quot;). HoldorFold.com is offered to you conditioned on your acceptance without modification of the terms, conditions, and notices contained herein (the &quot;Terms&quot;). Your use of HoldorFold.com constitutes your agreement to all such Terms. Please read these terms carefully, and keep a copy of them for your reference.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>HoldorFold.com is an E-Commerce Site</h2>
        <p className={pClass}>
          HoldorFold.com is a digital entertainment platform and interactive survival experience. The Website provides access to a curated content library, gameplay interfaces, and community features. Users may acquire &apos;Gold,&apos; which is a limited, non-transferable, and revocable license for use solely within the Project Vault ecosystem; Gold has no real-world cash value and does not constitute personal property.
        </p>
        <p className={pClass}>
          The &apos;Mercy Pot&apos; and related metrics are proprietary site content and collective game statistics representing in-game narrative lore. These displays are for entertainment and illustrative purposes only; they do not represent a bank account, escrow fund, stored value, or a &apos;wallet&apos; belonging to the User. Users acknowledge that they have no legal or equitable claim to any funds or values displayed. Vector Dayton LLC reserves the absolute right to utilize its corporate funds for marketing, promotion, or operations at its sole discretion. Any payments made by Vector Dayton LLC are strictly discretionary community incentives or contractual marketing fees paid to independent contractors under separate, specific agreements. Vector Dayton LLC may modify, suspend, or terminate any site feature or incentive program at any time, for any reason, without notice or liability.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Electronic Communications</h2>
        <p className={pClass}>
          Visiting HoldorFold.com or sending emails to Vector Dayton LLC constitutes electronic communications. You consent to receive electronic communications and you agree that all agreements, notices, disclosures and other communications that we provide to you electronically, via email and on the Site, satisfy any legal requirement that such communications be in writing.
        </p>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="t2">
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Your Account</h2>
        <p className={pClass}>
          If you use this site, you are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer, and you agree to accept responsibility for all activities that occur under your account or password. You may not assign or otherwise transfer your account to any other person or entity. You acknowledge that Vector Dayton LLC is not responsible for third party access to your account that results from theft or misappropriation of your account. Vector Dayton LLC and its associates reserve the right to refuse or cancel service, terminate accounts, or remove or edit content in our sole discretion.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Children Under Thirteen</h2>
        <p className={pClass}>
          Vector Dayton LLC does not knowingly collect, either online or offline, personal information from persons under the age of thirteen. If you are under 18, you may use HoldorFold.com only with permission of a parent or guardian.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Cancellation/Refund Policy</h2>
        <p className={pClass}>
          Users may cancel their account and cease use of the Website at any time. However, HoldorFold.com provides digital services and virtual licenses (&apos;Gold&apos;) that are consumed or granted immediately upon access; therefore, all interactions are final and no refunds, credits, or exchanges will be provided for any reason. Upon cancellation or termination of an account, all virtual currency, game progress, and access to the &apos;Project Vault&apos; ecosystem are immediately forfeited without any right to compensation or reimbursement. Vector Dayton LLC reserves the right to cancel or suspend any account without notice for violations of these Terms.
        </p>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="t3">
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Links to Third Party Sites/Third Party Services</h2>
        <p className={pClass}>
          HoldorFold.com may contain links to other websites (&quot;Linked Sites&quot;). The Linked Sites are not under the control of Vector Dayton LLC and Vector Dayton LLC is not responsible for the contents of any Linked Site, including without limitation any link contained in a Linked Site, or any changes or updates to a Linked Site. Vector Dayton LLC is providing these links to you only as a convenience, and the inclusion of any link does not imply endorsement by Vector Dayton LLC of the site or any association with its operators.
        </p>
        <p className={pClass}>
          Certain services made available via HoldorFold.com are delivered by third party sites and organizations. By using any product, service or functionality originating from the HoldorFold.com domain, you hereby acknowledge and consent that Vector Dayton LLC may share such information and data with any third party with whom Vector Dayton LLC has a contractual relationship to provide the requested product, service or functionality on behalf of HoldorFold.com users and customers.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>No Unlawful or Prohibited Use/Intellectual Property</h2>
        <p className={pClass}>
          You are granted a non-exclusive, non-transferable, revocable license to access and use HoldorFold.com strictly in accordance with these terms of use. As a condition of your use of the Site, you warrant to Vector Dayton LLC that you will not use the Site for any purpose that is unlawful or prohibited by these Terms. You may not use the Site in any manner which could damage, disable, overburden, or impair the Site or interfere with any other party&apos;s use and enjoyment of the Site. You may not obtain or attempt to obtain any materials or information through any means not intentionally made available or provided for through the Site.
        </p>
        <p className={pClass}>
          All content included as part of the Service, such as text, graphics, logos, images, as well as the compilation thereof, and any software used on the Site, is the property of Vector Dayton LLC or its suppliers and protected by copyright and other laws that protect intellectual property and proprietary rights. You agree to observe and abide by all copyright and other proprietary notices, legends or other restrictions contained in any such content and will not make any changes thereto.
        </p>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="t4">
      <section className={pageSectionClass}>
        <p className={pClass}>
          You will not modify, publish, transmit, reverse engineer, participate in the transfer or sale, create derivative works, or in any way exploit any of the content, in whole or in part, found on the Site. Vector Dayton LLC content is not for resale. Your use of the Site does not entitle you to make any unauthorized use of any protected content, and in particular you will not delete or alter any proprietary rights or attribution notices in any content. You will use protected content solely for your personal use, and will make no other use of the content without the express written permission of Vector Dayton LLC and the copyright owner. You agree that you do not acquire any ownership rights in any protected content. We do not grant you any licenses, express or implied, to the intellectual property of Vector Dayton LLC or our licensors except as expressly authorized by these Terms.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Use of Communication Services</h2>
        <p className={pClass}>
          The Site may contain bulletin board services, chat areas, news groups, forums, communities, personal web pages, calendars, and/or other message or communication facilities designed to enable you to communicate with the public at large or with a group (collectively, &quot;Communication Services&quot;). You agree to use the Communication Services only to post, send and receive messages and material that are proper and related to the particular Communication Service.
        </p>
        <p className={pClass}>
          By way of example, and not as a limitation, you agree that when using a Communication Service, you will not: defame, abuse, harass, stalk, threaten or otherwise violate the legal rights (such as rights of privacy and publicity) of others; publish, post, upload, distribute or disseminate any inappropriate, profane, defamatory, infringing, obscene, indecent or unlawful topic, name, material or information; upload files that contain software or other material protected by intellectual property laws (or by rights of privacy of publicity) unless you own or control the rights thereto or have received all necessary consents; upload files that contain viruses, corrupted files, or any other similar software or programs that may damage the operation of another&apos;s computer; advertise or offer to sell or buy any goods or services for any business purpose, unless such Communication Service specifically allows such messages; conduct or forward surveys, contests, pyramid schemes or chain letters; download any file posted by another user of a Communication Service that you know, or reasonably should know, cannot be legally distributed in such manner; falsify or delete any author attributions, legal or other proper notices or proprietary designations or labels of the origin or source of software or other material contained in a file that is uploaded; restrict or inhibit any other user from using and enjoying the Communication Services; violate any code of conduct or other guidelines which may be applicable for any particular Communication Service; harvest or otherwise collect information about others, including e-mail addresses, without their consent; violate any applicable laws or regulations. Use of automated &apos;bots&apos; or scripts to manipulate the chat or game economy is strictly prohibited.
        </p>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="t5">
      <section className={pageSectionClass}>
        <p className={pClass}>
          Vector Dayton LLC has no obligation to monitor the Communication Services. However, Vector Dayton LLC reserves the right to review materials posted to a Communication Service and to remove any materials in its sole discretion. Vector Dayton LLC reserves the right to terminate your access to any or all of the Communication Services at any time without notice for any reason whatsoever.
        </p>
        <p className={pClass}>
          Vector Dayton LLC reserves the right at all times to disclose any information as necessary to satisfy any applicable law, regulation, legal process or governmental request, or to edit, refuse to post or to remove any information or materials, in whole or in part, in Vector Dayton LLC&apos;s sole discretion.
        </p>
        <p className={pClass}>
          Always use caution when giving out any personally identifying information about yourself or your children in any Communication Service. Vector Dayton LLC does not control or endorse the content, messages or information found in any Communication Service and, therefore, Vector Dayton LLC specifically disclaims any liability with regard to the Communication Services and any actions resulting from your participation in any Communication Service. Managers and hosts are not authorized Vector Dayton LLC spokespersons, and their views do not necessarily reflect those of Vector Dayton LLC.
        </p>
        <p className={pClass}>
          Materials uploaded to a Communication Service may be subject to posted limitations on usage, reproduction and/or dissemination. You are responsible for adhering to such limitations if you upload the materials.
        </p>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="t6">
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Materials Provided to HoldorFold.com or Posted on Any Vector Dayton LLC Web Page</h2>
        <p className={pClass}>
          Vector Dayton LLC does not claim ownership of the materials you provide to HoldorFold.com (including feedback and suggestions) or post, upload, input or submit to any Vector Dayton LLC Site or our associated services (collectively &quot;Submissions&quot;). However, by posting, uploading, inputting, providing or submitting your Submission you are granting Vector Dayton LLC, our affiliated companies and necessary sublicensees permission to use your Submission in connection with the operation of their Internet businesses including, without limitation, the rights to: copy, distribute, transmit, publicly display, publicly perform, reproduce, edit, translate and reformat your Submission; and to publish your name in connection with your Submission.
        </p>
        <p className={pClass}>
          No compensation will be paid with respect to the use of your Submission, as provided herein. Vector Dayton LLC is under no obligation to post or use any Submission you may provide and may remove any Submission at any time in Vector Dayton LLC&apos;s sole discretion.
        </p>
        <p className={pClass}>
          By posting, uploading, inputting, providing or submitting your Submission you warrant and represent that you own or otherwise control all of the rights to your Submission as described in this section including, without limitation, all the rights necessary for you to provide, post, upload, input or submit the Submissions.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Third Party Accounts</h2>
        <p className={pClass}>
          You will be able to connect your Vector Dayton LLC account to third party accounts. By connecting your Vector Dayton LLC account to your third party account, you acknowledge and agree that you are consenting to the continuous release of information about you to others (in accordance with your privacy settings on those third party sites). If you do not want information about you to be shared in this manner, do not use this feature.
        </p>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="t7">
      <section className={pageSectionClass}>
        <h2 className={headingClass}>International Users</h2>
        <p className={pClass}>
          The Service is controlled, operated and administered by Vector Dayton LLC from our offices within the USA. If you access the Service from a location outside the USA, you are responsible for compliance with all local laws. You agree that you will not use the Vector Dayton LLC Content accessed through HoldorFold.com in any country or in any manner prohibited by any applicable laws, restrictions or regulations.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Indemnification</h2>
        <p className={pClass}>
          You agree to indemnify, defend and hold harmless Vector Dayton LLC, its officers, directors, employees, agents and third parties, for any losses, costs, liabilities and expenses (including reasonable attorney&apos;s fees) relating to or arising out of your use of or inability to use the Site or services, any user postings made by you, your violation of any terms of this Agreement or your violation of any rights of a third party, or your violation of any applicable laws, rules or regulations. Vector Dayton LLC reserves the right, at its own cost, to assume the exclusive defense and control of any matter otherwise subject to indemnification by you, in which event you will fully cooperate with Vector Dayton LLC in asserting any available defenses.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Arbitration</h2>
        <p className={pClass}>
          In the event the parties are not able to resolve any dispute between them arising out of or concerning these Terms and Conditions, or any provisions hereof, whether in contract, tort, or otherwise at law or in equity for damages or any other relief, then such dispute shall be resolved only by final and binding arbitration pursuant to the Federal Arbitration Act, conducted by a single neutral arbitrator and administered by the American Arbitration Association, or a similar arbitration service selected by the parties, in a location mutually agreed upon by the parties. The arbitrator&apos;s award shall be final, and judgment may be entered upon it in any court having jurisdiction. In the event that any legal or equitable action, proceeding or arbitration arises out of or concerns these Terms and Conditions, the prevailing party shall be entitled to recover its costs and reasonable attorney&apos;s fees.
        </p>
        <p className={pClass}>
          The parties agree to arbitrate all disputes and claims in regards to these Terms and Conditions or any disputes arising as a result of these Terms and Conditions, whether directly or indirectly, including Tort claims that are a result of these Terms and Conditions. The parties agree that the Federal Arbitration Act governs the interpretation and enforcement of this provision. The entire dispute, including the scope and enforceability of this arbitration provision shall be determined by the Arbitrator. This arbitration provision shall survive the termination of these Terms and Conditions.
        </p>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="t8">
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Class Action Waiver</h2>
        <p className={pClass}>
          Any arbitration under these Terms and Conditions will take place on an individual basis; class arbitrations and class/representative/collective actions are not permitted. THE PARTIES AGREE THAT A PARTY MAY BRING CLAIMS AGAINST THE OTHER ONLY IN EACH&apos;S INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PUTATIVE CLASS, COLLECTIVE AND/OR REPRESENTATIVE PROCEEDING, SUCH AS IN THE FORM OF A PRIVATE ATTORNEY GENERAL ACTION AGAINST THE OTHER. Further, unless both you and Vector Dayton LLC agree otherwise, the arbitrator may not consolidate more than one person&apos;s claims, and may not otherwise preside over any form of a representative or class proceeding.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Liability Disclaimer</h2>
        <p className={pClass}>
          THE INFORMATION, SOFTWARE, PRODUCTS, AND SERVICES INCLUDED IN OR AVAILABLE THROUGH THE SITE MAY INCLUDE INACCURACIES OR TYPOGRAPHICAL ERRORS. CHANGES ARE PERIODICALLY ADDED TO THE INFORMATION HEREIN. VECTOR DAYTON LLC AND/OR ITS SUPPLIERS MAY MAKE IMPROVEMENTS AND/OR CHANGES IN THE SITE AT ANY TIME.
        </p>
        <p className={pClass}>
          VECTOR DAYTON LLC AND/OR ITS SUPPLIERS MAKE NO REPRESENTATIONS ABOUT THE SUITABILITY, RELIABILITY, AVAILABILITY, TIMELINESS, AND ACCURACY OF THE INFORMATION, SOFTWARE, PRODUCTS, SERVICES AND RELATED GRAPHICS CONTAINED ON THE SITE FOR ANY PURPOSE. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, ALL SUCH INFORMATION, SOFTWARE, PRODUCTS, SERVICES AND RELATED GRAPHICS ARE PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OR CONDITION OF ANY KIND. VECTOR DAYTON LLC AND/OR ITS SUPPLIERS HEREBY DISCLAIM ALL WARRANTIES AND CONDITIONS WITH REGARD TO THIS INFORMATION, SOFTWARE, PRODUCTS, SERVICES AND RELATED GRAPHICS, INCLUDING ALL IMPLIED WARRANTIES OR CONDITIONS OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT.
        </p>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="t9">
      <section className={pageSectionClass}>
        <p className={pClass}>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL VECTOR DAYTON LLC AND/OR ITS SUPPLIERS BE LIABLE FOR ANY DIRECT, INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF USE, DATA OR PROFITS, ARISING OUT OF OR IN ANY WAY CONNECTED WITH THE USE OR PERFORMANCE OF THE SITE, WITH THE DELAY OR INABILITY TO USE THE SITE OR RELATED SERVICES, THE PROVISION OF OR FAILURE TO PROVIDE SERVICES, OR FOR ANY INFORMATION, SOFTWARE, PRODUCTS, SERVICES AND RELATED GRAPHICS OBTAINED THROUGH THE SITE, OR OTHERWISE ARISING OUT OF THE USE OF THE SITE, WHETHER BASED ON CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY OR OTHERWISE, EVEN IF VECTOR DAYTON LLC OR ANY OF ITS SUPPLIERS HAS BEEN ADVISED OF THE POSSIBILITY OF DAMAGES.
        </p>
        <p className={pClass}>
          BECAUSE SOME STATES/JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF LIABILITY FOR CONSEQUENTIAL OR INCIDENTAL DAMAGES, THE ABOVE LIMITATION MAY NOT APPLY TO YOU. IF YOU ARE DISSATISFIED WITH ANY PORTION OF THE SITE, OR WITH ANY OF THESE TERMS OF USE, YOUR SOLE AND EXCLUSIVE REMEDY IS TO DISCONTINUE USING THE SITE.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Termination/Access Restriction</h2>
        <p className={pClass}>
          Vector Dayton LLC reserves the right, in its sole discretion, to terminate your access to the Site and the related services or any portion thereof at any time, without notice. To the maximum extent permitted by law, this agreement is governed by the laws of the State of California and you hereby consent to the exclusive jurisdiction and venue of courts in California in all disputes arising out of or relating to the use of the Site. Use of the Site is unauthorized in any jurisdiction that does not give effect to all provisions of these Terms, including, without limitation, this section.
        </p>
        <p className={pClass}>
          You agree that no joint venture, partnership, employment, or agency relationship exists between you and Vector Dayton LLC as a result of this agreement or use of the Site. Vector Dayton LLC&apos;s performance of this agreement is subject to existing laws and legal process, and nothing contained in this agreement is in derogation of Vector Dayton LLC&apos;s right to comply with governmental, court and law enforcement requests or requirements relating to your use of the Site or information provided to or gathered by Vector Dayton LLC with respect to such use.
        </p>
      </section>
    </PageContent>
  ),
  (
    <PageContent key="t10">
      <section className={pageSectionClass}>
        <p className={pClass}>
          If any part of this agreement is determined to be invalid or unenforceable pursuant to applicable law including, but not limited to, the warranty disclaimers and liability limitations set forth above, then the invalid or unenforceable provision will be deemed superseded by a valid, enforceable provision that most closely matches the intent of the original provision and the remainder of the agreement shall continue in effect.
        </p>
        <p className={pClass}>
          Unless otherwise specified herein, this agreement constitutes the entire agreement between the user and Vector Dayton LLC with respect to the Site and it supersedes all prior or contemporaneous communications and proposals, whether electronic, oral or written, between the user and Vector Dayton LLC with respect to the Site. A printed version of this agreement and of any notice given in electronic form shall be admissible in judicial or administrative proceedings based upon or relating to this agreement to the same extent and subject to the same conditions as other business documents and records originally generated and maintained in printed form. It is the express wish to the parties that this agreement and all related documents be written in English.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Changes to Terms</h2>
        <p className={pClass}>
          Vector Dayton LLC reserves the right, in its sole discretion, to change the Terms under which HoldorFold.com is offered. The most current version of the Terms will supersede all previous versions. Vector Dayton LLC encourages you to periodically review the Terms to stay informed of our updates.
        </p>
      </section>
      <section className={pageSectionClass}>
        <h2 className={headingClass}>Contact Us</h2>
        <p className={pClass}>
          Email Address: info@holdorfold.com
        </p>
        <p className={pClass}>
          <strong>Effective as of January 1, 2026</strong>
        </p>
      </section>
    </PageContent>
  ),
]

const TOTAL_PAGES = PAGES.length

export default function Terms() {
  const [page, setPage] = useState(0)
  const canPrev = page > 0
  const canNext = page < TOTAL_PAGES - 1

  return (
    <div className="min-h-full w-full font-mono flex flex-col lg:p-6 max-w-4xl mx-auto">
      <div className="glass-green rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-2 border-b glass-divider">
          <h1 className="text-xl sm:text-2xl font-bold text-bunker-green">Terms and Conditions</h1>
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
