import { Link } from 'react-router-dom'
import { company as c } from '../company.js'
import { usePublicConfig, naira } from '../api.js'

const Draft = () => (c.legalReviewed ? null : (
  <div className="notice" role="note"><b>Draft for legal review.</b> This document has not yet been approved by our lawyers and may change before launch.</div>
))
const Page = ({ title, children }) => (
  <div className="container legal">
    <h1>{title}</h1>
    <p className="muted small">Last updated: {c.lastUpdated}</p>
    <Draft />
    {children}
  </div>
)

export function Terms() {
  const { cfg } = usePublicConfig()
  const cap = cfg ? cfg.dailyCap : 'a limited number of'
  const min = cfg ? naira(cfg.minWithdrawalKobo) : 'the published minimum'
  const fee = cfg ? naira(cfg.withdrawalFeeKobo) : 'the published fee'
  return (
    <Page title="Terms of Use">
      <h2>1. Who we are</h2>
      <p>{c.tradingName} is operated by {c.name} (RC {c.rcNumber}), {c.address} ("we", "us"). By creating an account or using the platform you agree to these Terms and to our <Link to="/privacy">Privacy Notice</Link>.</p>

      <h2>2. Eligibility and your account</h2>
      <p>You must be at least 18 years old and able to enter a binding contract. You may hold one account only. The details you give us (name, phone number, email, bank account) must be your own and accurate. You are responsible for keeping your password and verification codes private. We will never ask you for them.</p>

      <h2>3. How Naija Earn works</h2>
      <p>Joining is free and members never pay to earn. Advertisers pay for advertising packages (Spark, Boost and Prime). The money an advertiser pays funds a campaign budget. Members are rewarded for watching approved sponsor videos in those campaigns to the end.</p>

      <h2>4. Rewards</h2>
      <ul>
        <li>A reward is credited only after our server validates that you watched the full video. Skipping, fast-forwarding, or running the video in the background does not count.</li>
        <li>You can earn from up to {cap} videos per day. The day resets at midnight, Africa/Lagos time. You can earn from each video once.</li>
        <li>Each reward is paid only from the prepaid budget of that campaign. When a budget is used up, the campaign closes and no further rewards are available from it.</li>
        <li>Only approved sponsor videos earn rewards. Views, likes, comments or subscriptions on other platforms never earn rewards.</li>
        <li>Rewards depend on campaigns being available. They are not a salary, an investment, interest or guaranteed income.</li>
      </ul>

      <h2>5. Withdrawals</h2>
      <ul>
        <li>The minimum withdrawal is {min}. A fee of {fee} is deducted from each payout. Both are shown before you submit and may be changed for future requests.</li>
        <li>You must give a Nigerian bank account in your own name. We may check the account name and delay or reject a request that does not match.</li>
        <li>You do not need to refer anyone in order to withdraw.</li>
        <li>A request is first reviewed by our team, and is marked paid only after the bank transfer is made. We may hold or reject a request we reasonably suspect of fraud or breach of these Terms, and will tell you the reason.</li>
      </ul>

      <h2>6. Referrals</h2>
      <p>Referrals are optional. Where a referral bonus is offered, it is shown in your account and is paid only under the rules shown there. Creating accounts for yourself, or inviting people who are not real, separate individuals, is not allowed.</p>

      <h2>7. Advertisers</h2>
      <ul>
        <li>Your package price and the number of validated views it includes are shown before you pay. Your budget is used only for validated views, and the platform does not guarantee any result beyond the validated views delivered.</li>
        <li>Your video must be your own or properly licensed, lawful, truthful and not misleading. We review every video before it goes live and may refuse or remove any video.</li>
        <li>Prohibited content includes illegal products or services, fraud or "get rich quick" claims, adult content, hate or violence, and anything that infringes another person's rights.</li>
        <li>If we reject your video before it runs, [refund policy to be confirmed by our lawyers]. Payments are processed by Paystack, Flutterwave or bank transfer, and are confirmed before a campaign is funded.</li>
      </ul>

      <h2>8. Acceptable use</h2>
      <p>You must not: open more than one account; use bots, scripts or tools to watch videos or skip the timer; hide your location to get around our rules; give false information; sell, rent or share your account; attack, overload or probe the platform; or harass our staff or other users.</p>

      <h2>9. Suspension and ending your account</h2>
      <p>We may suspend or close an account that breaks these Terms or that we reasonably suspect of fraud, and may withhold rewards obtained through a breach. Where we do, we will explain why and tell you how to appeal using the Support page. You may stop using the platform and ask us to close your account at any time, and any balance you are properly owed can be withdrawn under section 5.</p>

      <h2>10. Our content and your content</h2>
      <p>The platform, its design and our branding belong to us. Sponsor videos belong to the advertisers. You may not copy or redistribute them.</p>

      <h2>11. Disclaimers and liability</h2>
      <p>The platform is provided "as is". We do not promise that it will always be available or free of errors. To the extent the law allows, we are not liable for indirect or consequential losses, or for losses caused by events outside our control such as payment provider or network outages. Nothing in these Terms limits liability that cannot be limited by law.</p>

      <h2>12. Changes</h2>
      <p>We may update these Terms. If a change matters to you, we will notify you before it takes effect. Continuing to use the platform afterwards means you accept the updated Terms.</p>

      <h2>13. Governing law and disputes</h2>
      <p>These Terms are governed by the laws of the Federal Republic of Nigeria. Please contact us first so we can try to resolve a complaint. [Dispute resolution forum, such as the courts of a named state or arbitration, to be confirmed by our lawyers.]</p>

      <h2>14. Contact</h2>
      <p>{c.name}, {c.address}. Email {c.supportEmail}, phone {c.supportPhone}. See also our <Link to="/support">Support page</Link>.</p>
    </Page>
  )
}

export function Privacy() {
  return (
    <Page title="Privacy Notice">
      <p>This notice explains what personal data {c.name} ("we", "us"), the operator of {c.tradingName}, collects, why, and what your rights are under the Nigeria Data Protection Act 2023 (NDPA).</p>

      <h2>1. What we collect</h2>
      <ul>
        <li><b>Account details:</b> your full name, phone number, email address and a securely stored (hashed) password.</li>
        <li><b>Payout details:</b> bank name, account name and account number, when you request a withdrawal.</li>
        <li><b>Activity:</b> which videos you start and finish, rewards, withdrawals, referrals, and the date and time of each.</li>
        <li><b>Advertiser details:</b> your orders, videos you upload, and proof of payment if you pay by bank transfer.</li>
        <li><b>Technical data:</b> IP address, browser and device information, and security logs, used to keep the platform safe and detect fraud.</li>
      </ul>
      <p>We do not store your card number. Card and bank payments are handled by Paystack and Flutterwave.</p>

      <h2>2. Why we use it, and our lawful basis</h2>
      <ul>
        <li>To create and run your account, pay rewards and process withdrawals (to perform our contract with you).</li>
        <li>To verify your email and phone and keep your account secure (our legitimate interest, and to perform our contract).</li>
        <li>To prevent fraud, duplicate accounts and abuse (our legitimate interest).</li>
        <li>To confirm payments, keep accounting records and respond to lawful requests from authorities (legal obligation).</li>
        <li>To send you service messages such as verification codes and payout updates. Marketing, if we ever send it, will be based on your consent and you can withdraw it at any time.</li>
      </ul>

      <h2>3. Who we share it with</h2>
      <p>We share data only as needed with: payment providers (Paystack, Flutterwave); our hosting and database providers (for example Render, Vercel, MongoDB Atlas); file storage for videos and proofs of payment (Cloudinary); email and SMS providers that deliver your codes; our professional advisers; and regulators, courts or law enforcement where the law requires. Advertisers see only aggregate results such as the number of validated views. They do not see your personal details. We do not sell your personal data.</p>

      <h2>4. Transfers outside Nigeria</h2>
      <p>Some of our providers store or process data outside Nigeria. Where that happens, we use providers that apply appropriate safeguards, as the NDPA requires.</p>

      <h2>5. How long we keep it</h2>
      <p>We keep account and transaction records for as long as your account is open and for [retention period, for example six years] afterwards, to meet accounting and legal duties. Verification codes expire within minutes and are not kept in readable form.</p>

      <h2>6. Security</h2>
      <p>Passwords are hashed, connections are encrypted, access to administration is limited, and important actions are logged. No system is perfectly secure. If a breach affecting your data occurs, we will notify you and the Nigeria Data Protection Commission as the law requires.</p>

      <h2>7. Your rights</h2>
      <p>You may ask to access your data, correct it, delete it, restrict or object to some uses, receive a copy in a portable format, or withdraw consent you have given. We may keep data we must keep by law, such as payment records. Email {c.privacyEmail} and we will respond within the time the law allows. You also have the right to complain to the Nigeria Data Protection Commission.</p>

      <h2>8. Children</h2>
      <p>The platform is for people aged 18 and over. We do not knowingly collect data from children, and will delete it if we find we have.</p>

      <h2>9. Changes and contact</h2>
      <p>We will post any changes here and notify you of important ones. Data controller: {c.name} (RC {c.rcNumber}), {c.address}. Privacy contact: {c.privacyEmail}. See also our <Link to="/terms">Terms of Use</Link>.</p>
    </Page>
  )
}

const FAQ = [
  ['I did not get my verification code.', 'Check your spam folder and that your phone number and email are correct, then use "Send new codes" on the verify page. Codes expire after 15 minutes. If it still does not arrive, contact support.'],
  ['My reward was not credited.', 'A reward is credited only after the full video plays and our server confirms it. If the video reached the end and you saw an error, contact support with the video title and the time.'],
  ['Why can I not watch more videos today?', 'There is a daily limit, and it resets at midnight (Africa/Lagos). Each video can be watched once, and a campaign closes when its budget is used.'],
  ['How long does a withdrawal take?', 'A request is reviewed by our team, then paid by bank transfer. You can follow its status (pending, approved, paid or rejected) on your dashboard. A rejected request is returned to your balance with a reason.'],
  ['My payment went through but my package is not showing.', 'Open the Advertise page and press "Check payment". Card and bank payments are confirmed with Paystack or Flutterwave, and a bank transfer needs an admin to confirm it. Keep your payment reference handy when you contact us.'],
  ['Do I need to refer people to withdraw?', 'No. Referrals are optional and are never required to withdraw.'],
  ['How do I change my password?', 'Open Account in the menu, enter your current password and choose a new one. If you forgot it, use "Forgot password" on the log-in page.'],
]

export function Support() {
  const subject = encodeURIComponent('Naija Earn support request')
  return (
    <div className="container legal">
      <h1>Support</h1>
      <div className="card stack">
        <h2 style={{ marginTop: 0 }}>Contact us</h2>
        <p>Email: <a href={`mailto:${c.supportEmail}?subject=${subject}`}>{c.supportEmail}</a></p>
        <p>Phone: {c.supportPhone}</p>
        <p className="muted small">Hours: {c.hours}. When you write, include the email you registered with, a short description, and any payment or withdrawal reference. Never send your password or a verification code.</p>
      </div>
      <div className="notice green" role="note">
        <b>Stay safe.</b> We will never ask for your password or verification codes, and we never charge a fee to unlock your withdrawal. The only fee is the one shown before you request a payout. Messages that ask for more are scams. Please report them to us.
      </div>
      <h2>Common questions</h2>
      {FAQ.map(([q, a]) => (
        <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>
      ))}
      <p className="muted small">Read our <Link to="/terms">Terms of Use</Link> and <Link to="/privacy">Privacy Notice</Link>.</p>
    </div>
  )
}
