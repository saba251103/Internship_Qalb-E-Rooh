import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Genre, mockData, Song } from "../../data/mockData";

/* ---------------- SEARCH RESULT TYPE ---------------- */

type SearchResult = Song | Genre;

/* ---------------- SCREEN ---------------- */

export default function SearchScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const performSearch = (query: string) => {
    const q = query.trim().toLowerCase();

    if (!q) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const songResults = mockData.recentlyPlayed.filter(
      (song) =>
        song.title.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q)
    );

    const genreResults = mockData.genres.filter((genre) =>
      genre.name.toLowerCase().includes(q)
    );

    setResults([...songResults, ...genreResults]);
    setHasSearched(true);
  };

  return (
    <View style={styles.container}>
      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color="#5EEAD4" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* ---------- SEARCH BAR ---------- */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <View style={styles.searchIconWrapper}>
            <Ionicons name="search" size={20} color="#5EEAD4" />
          </View>

          <TextInput
            autoFocus
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              performSearch(text);
            }}
            placeholder="Search for songs or genres"
            placeholderTextColor="rgba(94, 234, 212, 0.35)"
            style={styles.searchInput}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                performSearch("");
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="rgba(94, 234, 212, 0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ---------- BODY ---------- */}
      <View style={styles.body}>
        {!hasSearched ? (
          <SearchSuggestions onSelect={performSearch} />
        ) : results.length === 0 ? (
          <NoResults query={searchQuery} />
        ) : (
          <SearchResults results={results} />
        )}
      </View>
    </View>
  );
}

/* ---------------- RESULTS LIST ---------------- */

function SearchResults({ results }: { results: SearchResult[] }) {
  return (
    <ScrollView 
      style={styles.resultsContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.resultsCount}>
        {results.length} {results.length === 1 ? 'result' : 'results'}
      </Text>
      
      {results.map((item, index) => {
        // SONG
        if ("artist" in item) {
          return (
            <Link
              key={index}
              href={{
                pathname: "/screens/player/[songId]",
                params: { songId: item.id },
              }}
              asChild
            >
              <TouchableOpacity 
                style={styles.resultItem}
                activeOpacity={0.7}
              >
                <Image source={item.albumArt} style={styles.albumArt} />

                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.resultSubtitle} numberOfLines={1}>
                    {item.artist}
                  </Text>
                </View>

                <View style={styles.playButtonWrapper}>
                  <Ionicons
                    name="play-circle"
                    size={36}
                    color="#5EEAD4"
                  />
                </View>
              </TouchableOpacity>
            </Link>
          );
        }

        // GENRE
        return (
          <Link
            key={index}
            href={{
              pathname: "/screens/genre/[genreId]",
              params: { genreId: item.id },
            }}
            asChild
          >
            <TouchableOpacity 
              style={styles.resultItem}
              activeOpacity={0.7}
            >
              <View style={styles.genreIcon}>
                <MaterialIcons
                  name="library-music"
                  size={26}
                  color="#0a3d3d"
                />
              </View>

              <View style={styles.resultTextContainer}>
                <Text style={styles.resultTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.resultSubtitle}>Genre</Text>
              </View>
              
              <Ionicons
                name="chevron-forward"
                size={24}
                color="rgba(94, 234, 212, 0.4)"
              />
            </TouchableOpacity>
          </Link>
        );
      })}
      
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

/* ---------------- EMPTY STATE ---------------- */

function NoResults({ query }: { query: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="search-outline" size={64} color="#5EEAD4" />
      </View>
      <Text style={styles.emptyTitle}>
        No results found
      </Text>
      <Text style={styles.emptyQuery}>
        "{query}"
      </Text>
      <Text style={styles.emptySubtitle}>
        Try searching with different keywords
      </Text>
    </View>
  );
}

/* ---------------- SUGGESTIONS ---------------- */

function SearchSuggestions({
  onSelect,
}: {
  onSelect: (value: string) => void;
}) {
  const suggestions = ["Bollywood", "Harry Styles", "Nasheeds"];

  return (
    <View style={styles.suggestionsContainer}>
      <Text style={styles.suggestionsTitle}>Suggested Searches</Text>

      {suggestions.map((item, index) => (
        <TouchableOpacity
          key={item}
          onPress={() => onSelect(item)}
          style={[
            styles.suggestionItem,
            index === suggestions.length - 1 && styles.lastSuggestion
          ]}
          activeOpacity={0.7}
        >
          <View style={styles.suggestionIconContainer}>
            <Ionicons
              name="time-outline"
              size={20}
              color="#5EEAD4"
            />
          </View>
          <Text style={styles.suggestionText}>{item}</Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color="rgba(94, 234, 212, 0.3)"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a3d3d",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#0a3d3d",
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20, 184, 166, 0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: "rgba(94, 234, 212, 0.15)",
  },
  searchIconWrapper: {
    paddingRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  clearButton: {
    padding: 4,
  },
  body: {
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(94, 234, 212, 0.6)",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20, 184, 166, 0.06)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(94, 234, 212, 0.1)",
  },
  albumArt: {
    height: 60,
    width: 60,
    borderRadius: 12,
    marginRight: 14,
  },
  resultTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  resultSubtitle: {
    fontSize: 14,
    color: "rgba(94, 234, 212, 0.75)",
    fontWeight: "500",
  },
  playButtonWrapper: {
    marginLeft: 8,
  },
  genreIcon: {
    height: 60,
    width: 60,
    borderRadius: 12,
    backgroundColor: "#5EEAD4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    backgroundColor: "rgba(20, 184, 166, 0.08)",
    borderRadius: 50,
    padding: 28,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(94, 234, 212, 0.15)",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptyQuery: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5EEAD4",
    textAlign: "center",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "rgba(94, 234, 212, 0.6)",
    textAlign: "center",
    fontWeight: "500",
  },
  suggestionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  suggestionsTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20, 184, 166, 0.06)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(94, 234, 212, 0.12)",
  },
  lastSuggestion: {
    marginBottom: 0,
  },
  suggestionIconContainer: {
    marginRight: 14,
    backgroundColor: "rgba(94, 234, 212, 0.12)",
    borderRadius: 10,
    padding: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  bottomSpacing: {
    height: 20,
  },
});