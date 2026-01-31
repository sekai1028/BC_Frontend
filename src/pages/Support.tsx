export default function Support() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-bunker-green mb-6">SUPPORT</h1>
      <div className="bg-gray-900 border border-bunker-green p-6 rounded">
        <form className="space-y-4">
          <div>
            <label className="block text-bunker-green mb-2">Email</label>
            <input
              type="email"
              className="w-full bg-black border border-bunker-green px-4 py-2 focus:outline-none focus:ring-2 focus:ring-bunker-green"
            />
          </div>
          <div>
            <label className="block text-bunker-green mb-2">Issue Category</label>
            <select className="w-full bg-black border border-bunker-green px-4 py-2 focus:outline-none focus:ring-2 focus:ring-bunker-green">
              <option>Payment Issue</option>
              <option>Bug Report</option>
              <option>Account Access</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-bunker-green mb-2">Message</label>
            <textarea
              rows={6}
              className="w-full bg-black border border-bunker-green px-4 py-2 focus:outline-none focus:ring-2 focus:ring-bunker-green"
            />
          </div>
          <button
            type="submit"
            className="bg-bunker-green text-black px-6 py-2 font-bold hover:bg-bunker-green/80"
          >
            SUBMIT
          </button>
        </form>
      </div>
    </div>
  )
}
