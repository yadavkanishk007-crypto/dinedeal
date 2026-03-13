import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

const FAQs = () => {
  const navigate = useNavigate();

  const faqCategories = [
    {
      title: "Getting Started",
      faqs: [
        {
          question: "What is DineDeal?",
          answer: "DineDeal is a dine-in payment platform that helps you save money when dining at partner restaurants. Simply scan the QR code at the restaurant, and pay your bill through our app to avail exclusive discounts.",
        },
        {
          question: "How do I use DineDeal at a restaurant?",
          answer: "1. Visit any partner restaurant\n2. Scan the DineDeal QR code at your table\n3. Wait for the restaurant to post your bill\n4. Review the discount applied automatically\n5. Pay through the app and enjoy your savings!",
        },
        {
          question: "Is there a fee to use DineDeal?",
          answer: "No, DineDeal is completely free for customers. There are no hidden charges or subscription fees. You simply pay your discounted bill amount.",
        },
      ],
    },
    {
      title: "Payments & Billing",
      faqs: [
        {
          question: "What payment methods are supported?",
          answer: "We support UPI payments through all major UPI apps like Google Pay, PhonePe, Paytm, and others. Card payments are also available through our secure payment gateway.",
        },
        {
          question: "How are discounts applied?",
          answer: "Discounts are automatically applied based on the restaurant's active offers. You'll see the original bill amount, discount applied, and final payable amount clearly before making payment.",
        },
        {
          question: "What if my payment fails?",
          answer: "If your payment fails, no amount is deducted from your account. You can retry the payment. If money was deducted but payment shows failed, it will be refunded within 5-7 business days.",
        },
        {
          question: "Do I get a receipt after payment?",
          answer: "Yes! You receive a DineDeal digital receipt showing the original bill, discount applied, amount paid, and payment reference. The restaurant will also provide you with the POS/GST bill separately.",
        },
      ],
    },
    {
      title: "Rewards & Offers",
      faqs: [
        {
          question: "How do I earn reward points?",
          answer: "You earn reward points on every successful transaction. The points are calculated based on your final bill amount. These points can be redeemed for additional discounts on future orders.",
        },
        {
          question: "Can I combine multiple offers?",
          answer: "Currently, only one offer can be applied per transaction. The best available offer for your bill amount is automatically selected.",
        },
        {
          question: "Do reward points expire?",
          answer: "Reward points are valid for 12 months from the date of earning. Make sure to redeem them before they expire!",
        },
      ],
    },
    {
      title: "Account & Security",
      faqs: [
        {
          question: "How do I reset my password?",
          answer: "Go to Profile > Privacy & Security > Change Password. You'll receive a password reset link on your registered email address.",
        },
        {
          question: "Is my payment information secure?",
          answer: "Yes, absolutely. We use industry-standard encryption and never store your card details on our servers. All payments are processed through secure payment gateways.",
        },
        {
          question: "How do I delete my account?",
          answer: "To delete your account, please contact our customer support. Note that deleting your account will permanently remove all your transaction history and reward points.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.header
        className="sticky top-0 z-40 glass border-b border-border/30"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="container py-4 flex items-center gap-4">
          <motion.button
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="font-display font-bold text-lg text-foreground">FAQs</h1>
        </div>
      </motion.header>

      <main className="container py-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display font-bold text-xl text-foreground mb-2">How can we help?</h2>
          <p className="text-muted-foreground text-sm">Find answers to commonly asked questions</p>
        </motion.div>

        {/* FAQ Categories */}
        {faqCategories.map((category, categoryIndex) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase">{category.title}</h3>
            <Card className="border-border/50">
              <Accordion type="single" collapsible className="w-full">
                {category.faqs.map((faq, faqIndex) => (
                  <AccordionItem key={faqIndex} value={`${categoryIndex}-${faqIndex}`} className="border-border/50">
                    <AccordionTrigger className="px-4 text-left text-sm font-medium text-foreground hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-line">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          </motion.div>
        ))}

        {/* Contact Support */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/50 bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg text-foreground mb-2">Still have questions?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our support team is here to help you 24/7
              </p>
              <Button onClick={() => navigate("/support")} className="gradient-primary">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default FAQs;
