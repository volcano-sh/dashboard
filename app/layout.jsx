import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import Providers from "./providers";

export const metadata = {
    title: "Volcano Dashboard",
    description: "Volcano scheduler dashboard",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
