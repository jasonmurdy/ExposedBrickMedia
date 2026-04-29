/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookingForm } from '../components/BookingAndFooter';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function InquiryPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Helmet>
        <title>Start an Inquiry | Exposed Brick Media</title>
        <meta name="description" content="Request a quote for architectural capture and digital marketing." />
      </Helmet>
      <div className="w-full px-8 md:px-12 lg:px-16 py-6 border-b border-border-subtle flex items-center gap-4 text-[10px] uppercase tracking-widest text-text-primary/60">
        <Link to="/" className="hover:text-brick-copper transition-colors">Home</Link>
        <span>/</span>
        <span className="text-text-primary">Inquiry</span>
      </div>
      
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 md:p-16 lg:p-24"
      >
        <div className="max-w-2xl mx-auto">
          <BookingForm />
        </div>
      </motion.section>
    </div>
  );
}
