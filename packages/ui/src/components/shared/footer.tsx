import { Separator } from "@workspace/ui/components/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import { TwitterIcon, Linkedin01Icon, InstagramIcon, DribbbleIcon } from "@hugeicons/core-free-icons";

type FooterData = {
  title: string;
  links: {
    title: string;
    href: string;
  }[];
};

const footerSections: FooterData[] = [
  {
    title: "Sitemap",
    links: [
      { title: "Contact us", href: "#" },
      { title: "About us", href: "#" },
      { title: "Work", href: "#" },
      { title: "Services", href: "#" },
      { title: "Pricing", href: "#" },
    ],
  },
  {
    title: "Other Pages",
    links: [
      { title: "Error 404", href: "#" },
      { title: "Terms & Conditions", href: "#" },
      { title: "Privacy Policy", href: "#" },
    ],
  },
];

type FooterProps = {
  logo?: React.ReactNode;
  description?: string;
  sections?: FooterData[];
};

export function Footer({
  logo,
  description = "Empowering businesses with innovative solutions. Let's create something amazing together.",
  sections = footerSections,
}: FooterProps) {
  return (
    <footer className="py-10">
      <div className="max-w-7xl xl:px-16 lg:px-8 px-4 mx-auto">
        <div className="flex flex-col gap-6 sm:gap-12">
          <div className="py-12 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 gap-x-8 gap-y-10 px-6 xl:px-0">
            <div className="col-span-full lg:col-span-4">
              <div className="flex flex-col gap-6">
                {logo}
                <p className="text-base font-normal text-muted-foreground">
                  {description}
                </p>
                <div className="flex items-center gap-4">
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    <HugeiconsIcon icon={TwitterIcon} size={20} />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    <HugeiconsIcon icon={Linkedin01Icon} size={20} />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    <HugeiconsIcon icon={DribbbleIcon} size={20} />
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    <HugeiconsIcon icon={InstagramIcon} size={20} />
                  </a>
                </div>
              </div>
            </div>

            <div className="col-span-1 lg:block hidden"></div>

            {sections.map(({ title, links }, index) => (
              <div key={index} className="col-span-2">
                <div className="flex flex-col gap-4">
                  <p className="text-base font-medium text-foreground">
                    {title}
                  </p>
                  <ul className="flex flex-col gap-3">
                    {links.map(({ title, href }) => (
                      <li key={title}>
                        <a
                          href={href}
                          className="text-base font-normal text-muted-foreground hover:text-foreground"
                        >
                          {title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <Separator orientation="horizontal" />
          <p className="text-sm font-normal text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Pdf Creator. All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
