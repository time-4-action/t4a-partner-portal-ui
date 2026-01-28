import { auth0 } from "../lib/auth0";

async function HomePage() {
  const session = await auth0.getSession();
  const user = session?.user;

  if (user) {
    // Logged-in partner view
    return (
      <div className="relative flex h-full items-center px-6 pt-14 lg:px-8 p-8">
        <div className="relative mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-100 sm:text-5xl">
              Your Direct Source for Patrik's Product Data
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral-300">
              Welcome, Partner. This portal provides you with direct, real-time
              access to our product catalog. Easily sync our data to your
              website or system to ensure your customers always see the latest
              information.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/product"
                className="rounded-md bg-[#01a0be] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#018a9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#01a0be]"
              >
                View Product Catalog
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Public view for non-logged-in users
  return (
    <div className="relative flex h-full items-center px-6 pt-14 lg:px-8 p-8">
      <div className="relative mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-100 sm:text-5xl">
            Welcome to the Patrik Partner Portal
          </h1>
          <p className="mt-6 text-lg leading-8 text-neutral-300">
            Access real-time product data and resources. Log in to view our
            product catalog and manage your integration.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/auth/login"
              className="rounded-md bg-[#01a0be] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#018a9f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#01a0be]"
            >
              Partner Login
            </a>
            <a
              href="/contact"
              className="text-sm font-semibold leading-6 text-neutral-100"
            >
              Contact us <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
