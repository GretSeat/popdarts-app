import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Card, Button, Chip } from "react-native-paper";
import ScreenContainer from "../components/ScreenContainer";

const { width } = Dimensions.get("window");

/**
 * Store Screen - Placeholder page resembling popdartsgame.com store
 * Shows product grid with images, names, and prices
 */
export default function StoreScreen() {
  const insets = useSafeAreaInsets();

  // Placeholder products data
  const products = [
    {
      id: 1,
      name: "Pro Pack",
      price: "$19.99",
      image: "https://via.placeholder.com/300x300/2196F3/FFFFFF?text=Pro+Pack",
      tag: "Best Seller",
    },
    {
      id: 2,
      name: "PopGolf™ Board Set",
      price: "$103.99",
      image: "https://via.placeholder.com/300x300/4CAF50/FFFFFF?text=PopGolf",
      tag: "Sold Out",
      soldOut: true,
    },
    {
      id: 3,
      name: "Tourney Boards Set",
      price: "$104.99",
      image: "https://via.placeholder.com/300x300/FF9800/FFFFFF?text=Tourney",
      tag: "Hot",
    },
    {
      id: 4,
      name: "Drizzle",
      price: "$39.99",
      image: "https://via.placeholder.com/300x300/9C27B0/FFFFFF?text=Drizzle",
      tag: "New",
    },
    {
      id: 5,
      name: "USA Board Set",
      price: "$119.99",
      image: "https://via.placeholder.com/300x300/F44336/FFFFFF?text=USA",
      tag: "Limited",
    },
    {
      id: 6,
      name: "SwapTop Frame",
      price: "$89.99",
      image: "https://via.placeholder.com/300x300/00BCD4/FFFFFF?text=SwapTop",
      tag: "Featured",
    },
  ];

  const categories = [
    "All Games",
    "Darts",
    "Boards",
    "Mods",
    "Gear",
    "New Drops",
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10, paddingBottom: 10 },
        ]}
      >
        <Text style={styles.headerTitle}>POPDARTS STORE</Text>
        <Text style={styles.headerSubtitle}>Shop All Games</Text>
      </View>

      <ScrollView style={styles.container}>
        <ScreenContainer>
          {/* Banner Section */}
          <View style={styles.bannerSection}>
            <Card style={styles.bannerCard}>
              <Card.Content>
                <Text style={styles.bannerTitle}>SWAPTOP</Text>
                <Text style={styles.bannerSubtitle}>
                  One Frame, Endless Games
                </Text>
                <Text style={styles.bannerDescription}>
                  A game-changing experience from Popdarts that allows you to
                  swap games with an interchangeable frame system.
                </Text>
                <Button
                  mode="contained"
                  style={styles.bannerButton}
                  labelStyle={styles.bannerButtonText}
                >
                  Shop Now
                </Button>
              </Card.Content>
            </Card>
          </View>

          {/* Category Chips */}
          <View style={styles.categorySection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((category, index) => (
                <Chip
                  key={index}
                  style={styles.categoryChip}
                  textStyle={styles.categoryText}
                  selected={index === 0}
                >
                  {category}
                </Chip>
              ))}
            </ScrollView>
          </View>

          {/* Shipping Banner */}
          <View style={styles.shippingBanner}>
            <Text style={styles.shippingText}>🚀 SHIPS NEXT BUSINESS DAY</Text>
          </View>

          {/* Products Grid */}
          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>Hot and Trending 🔥</Text>

            <View style={styles.productsGrid}>
              {products.map((product) => (
                <Card key={product.id} style={styles.productCard}>
                  <Card.Content style={styles.productContent}>
                    {/* Product Tag */}
                    {product.tag && (
                      <View
                        style={[
                          styles.productTag,
                          product.soldOut && styles.productTagSoldOut,
                        ]}
                      >
                        <Text style={styles.productTagText}>{product.tag}</Text>
                      </View>
                    )}

                    {/* Product Image Placeholder */}
                    <View style={styles.productImageContainer}>
                      <View style={styles.productImagePlaceholder}>
                        <Text style={styles.productImageText}>
                          {product.name}
                        </Text>
                      </View>
                    </View>

                    {/* Product Info */}
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>{product.price}</Text>

                    {/* Add to Cart Button */}
                    <Button
                      mode={product.soldOut ? "outlined" : "contained"}
                      style={styles.addButton}
                      labelStyle={styles.addButtonText}
                      disabled={product.soldOut}
                    >
                      {product.soldOut ? "Sold Out" : "Add to Cart"}
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </View>

          {/* Path to Pro Section */}
          <View style={styles.proSection}>
            <Card style={styles.proCard}>
              <Card.Content>
                <Text style={styles.proTitle}>PATH TO PRO 📈</Text>
                <Text style={styles.proDescription}>
                  Go from Rookie to Pro to Elite in just 3 games.
                </Text>
                <Button
                  mode="outlined"
                  style={styles.proButton}
                  labelStyle={styles.proButtonText}
                >
                  Learn More
                </Button>
              </Card.Content>
            </Card>
          </View>

          {/* Free Shipping Notice */}
          <View style={styles.footerNotice}>
            <Text style={styles.footerText}>
              Spend $50 and get FREE SHIPPING! 📦
            </Text>
          </View>

          {/* Placeholder Notice */}
          <View style={styles.placeholderNotice}>
            <Text style={styles.placeholderText}>🚧 Store Coming Soon! 🚧</Text>
            <Text style={styles.placeholderSubtext}>
              This is a placeholder design. Full store functionality will be
              added in a future update.
            </Text>
          </View>
        </ScreenContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    marginTop: 4,
    opacity: 0.9,
  },
  bannerSection: {
    padding: 15,
  },
  bannerCard: {
    backgroundColor: "#1976D2",
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 2,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 5,
    fontWeight: "600",
  },
  bannerDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  bannerButton: {
    marginTop: 15,
    backgroundColor: "#4CAF50",
  },
  bannerButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  categorySection: {
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  categoryScroll: {
    paddingHorizontal: 15,
    gap: 8,
  },
  categoryChip: {
    marginHorizontal: 2,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  shippingBanner: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    alignItems: "center",
  },
  shippingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  productsSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: Platform.OS === "web" ? "flex-start" : "space-between",
    gap: Platform.OS === "web" ? 20 : 0,
  },
  productCard: {
    width: Platform.OS === "web" ? "calc(25% - 15px)" : (width - 45) / 2,
    minWidth: Platform.OS === "web" ? 220 : undefined,
    maxWidth: Platform.OS === "web" ? 300 : undefined,
    marginBottom: 15,
    backgroundColor: "#FFFFFF",
  },
  productContent: {
    padding: 10,
  },
  productTag: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#FF5722",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  productTagSoldOut: {
    backgroundColor: "#9E9E9E",
  },
  productTagText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  productImageContainer: {
    marginBottom: 10,
  },
  productImagePlaceholder: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  productImageText: {
    color: "#757575",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 10,
  },
  addButton: {
    marginTop: 5,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  proSection: {
    padding: 15,
  },
  proCard: {
    backgroundColor: "#1A237E",
  },
  proTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  proDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 8,
  },
  proButton: {
    marginTop: 15,
    borderColor: "#FFFFFF",
  },
  proButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  footerNotice: {
    backgroundColor: "#FFEB3B",
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 10,
  },
  footerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  placeholderNotice: {
    backgroundColor: "#FFF3E0",
    padding: 20,
    margin: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FF9800",
    borderStyle: "dashed",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E65100",
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});
