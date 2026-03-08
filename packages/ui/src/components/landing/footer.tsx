import { Separator } from "@workspace/ui/components/separator";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { File01Icon } from "@hugeicons/core-free-icons";

type FooterData = {
  title: string;
  links: {
    title: string;
    href: string;
  }[];
};

const footerSections: FooterData[] = [
  {
    title: "Product",
    links: [
      { title: "Features", href: "/features" },
      { title: "Pricing", href: "/pricing" },
      { title: "API Reference", href: "/docs/api" },
      { title: "SDK", href: "/docs/sdk" },
    ],
  },
  {
    title: "Resources",
    links: [
      { title: "Documentation", href: "/docs" },
      { title: "Quickstart", href: "/docs/quickstart" },
      { title: "Templates", href: "/docs/templates" },
      { title: "Webhooks", href: "/docs/webhooks" },
    ],
  },
];

const socialLinks = [
  { title: "Twitter", href: "https://twitter.com" },
  { title: "GitHub", href: "https://github.com" },
  { title: "LinkedIn", href: "https://linkedin.com" },
];

const Footer = () => {
  return (
    <footer className="py-10">
      <div className="max-w-7xl xl:px-16 lg:px-8 px-4 mx-auto">
        <div className="flex flex-col gap-6 sm:gap-12">
          {/* Newsletter signup row */}
          <div className="py-8 px-6 xl:px-0 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-medium text-foreground">
                  Subscribe to updates
                </h3>
                <p className="text-sm text-muted-foreground">
                  Get the latest news on features, releases, and tips.
                </p>
              </div>
              <form
                className="flex items-center gap-2 w-full sm:w-auto"
                onSubmit={(e) => e.preventDefault()}
              >
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full sm:w-64"
                />
                <Button type="submit" size="sm" className="shrink-0 cursor-pointer">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>

          <Separator orientation="horizontal" />

          {/* Footer columns */}
          <div className="py-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 gap-x-8 gap-y-10 px-6 xl:px-0">
            {/* Logo + description */}
            <div className="col-span-full lg:col-span-4">
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-150 ease-in-out fill-mode-both">
                <a href="/" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <HugeiconsIcon
                      icon={File01Icon}
                      size={16}
                      className="text-primary-foreground"
                    />
                  </div>
                  <span className="text-sm font-bold">Pdf Creator</span>
                </a>
                <p className="text-base font-normal text-muted-foreground">
                  Design and export JSON specs with a visual editor, AI, or API. One
                  platform for all your document needs.
                </p>
              </div>
            </div>

            {/* Spacer */}
            <div className="col-span-1 lg:block hidden" />

            {/* Product + Resources */}
            {footerSections.map(({ title, links }, index) => (
              <div key={index} className="col-span-2">
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200 ease-in-out fill-mode-both">
                  <p className="text-base font-medium text-foreground">
                    {title}
                  </p>
                  <ul className="flex flex-col gap-3">
                    {links.map(({ title, href }) => (
                      <li key={title}>
                        <a
                          href={href}
                          className="text-base font-normal text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            {/* Company */}
            <div className="col-span-3">
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-250 ease-in-out fill-mode-both">
                <p className="text-base font-medium text-foreground">Company</p>
                <ul className="flex flex-col gap-3">
                  <li>
                    <a
                      href="/blog"
                      className="text-base font-normal text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      href="/contact"
                      className="text-base font-normal text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Contact
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy"
                      className="text-base font-normal text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/terms"
                      className="text-base font-normal text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <Separator orientation="horizontal" />

          {/* Bottom: copyright + social links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 xl:px-0 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 ease-in-out fill-mode-both">
            <p className="text-sm font-normal text-muted-foreground">
              &copy; {new Date().getFullYear()} Pdf Creator. All rights
              reserved.
            </p>
            <div className="flex items-center gap-6">
              {socialLinks.map(({ title, href }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
export default Footer;
