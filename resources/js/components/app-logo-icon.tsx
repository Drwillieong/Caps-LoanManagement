import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return <img src="/leimco logo.jpg" alt="Leimco Logo" {...props} />;
}
