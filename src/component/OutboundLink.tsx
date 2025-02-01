import Link from "next/link";

const OutboundLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
  <Link href={href} target="_blank" rel="noopener noreferrer" passHref>
    {children}
  </Link>
);

export default OutboundLink;