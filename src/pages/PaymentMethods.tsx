import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Smartphone, Plus, Check, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";

interface PaymentMethod {
  id: string;
  type: "upi" | "card";
  label: string;
  details: string;
  isDefault: boolean;
}

const PaymentMethods = () => {
  const navigate = useNavigate();
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "upi",
      label: "UPI",
      details: "Pay via any UPI app",
      isDefault: true,
    },
  ]);

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
          <h1 className="font-display font-bold text-lg text-foreground">Payment Methods</h1>
        </div>
      </motion.header>

      <main className="container py-6 space-y-6">
        {/* Saved Methods */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">SAVED METHODS</h2>
          <div className="space-y-3">
            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                        {method.type === "upi" ? (
                          <Smartphone className="w-6 h-6 text-primary" />
                        ) : (
                          <CreditCard className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{method.label}</p>
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{method.details}</p>
                      </div>
                    </div>
                    {method.isDefault && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Available Methods */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">AVAILABLE METHODS</h2>
          <div className="space-y-3">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">UPI</p>
                    <p className="text-sm text-muted-foreground">
                      Pay using Google Pay, PhonePe, Paytm & more
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Cards</p>
                    <p className="text-sm text-muted-foreground">
                      Credit & Debit cards (Visa, Mastercard, RuPay)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50 bg-secondary/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                💡 Your payment methods are securely processed through our payment gateway. 
                We never store your card details on our servers.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default PaymentMethods;
