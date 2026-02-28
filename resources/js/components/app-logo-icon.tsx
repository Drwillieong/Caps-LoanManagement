import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return <img src="/LogoLeimco.png" alt="Leimco Logo" {...props} />;
}

