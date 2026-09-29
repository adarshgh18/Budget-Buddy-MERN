export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="page-title">Privacy</h1>
      <div className="card p-6 mt-6 space-y-4 text-sm text-slate-600">
        <p>
          Budget Buddy stores the account and financial records you create so the app can show
          dashboards, budgets, and reports for your login only.
        </p>
        <p>
          Passwords are hashed. Session tokens are sent as httpOnly cookies. Receipt files you upload
          are stored on the application server for your account.
        </p>
        <p>
          This product does not connect to banks and does not sell your data to advertisers.
        </p>
      </div>
    </div>
  );
}
