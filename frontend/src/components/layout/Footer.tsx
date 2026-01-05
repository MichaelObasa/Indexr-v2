"use client";

import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-primary-500 to-accent-500">
              <span className="text-xs font-bold text-white">I</span>
            </div>
            <span className="text-sm font-medium text-surface-600 dark:text-surface-400">
              Indexr - The Vanguard of Web3
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <Link
              href="https://twitter.com/Indexr_xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-surface-400 transition-colors hover:text-primary-500"
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link
              href="https://github.com/MichaelObasa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-surface-400 transition-colors hover:text-primary-500"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </div>

          <p className="text-sm text-surface-500 dark:text-surface-500">
            Built on Arbitrum. Powered by stablecoins.
          </p>
        </div>

        <div className="mt-8 border-t border-surface-200 pt-8 text-center dark:border-surface-800">
          <p className="text-xs text-surface-400 dark:text-surface-500">
            &copy; {new Date().getFullYear()} Indexr. All rights reserved. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

