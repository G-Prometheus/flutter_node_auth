import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart'; // Thêm package intl để xử lý định dạng thời gian

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  List<dynamic> historyData = []; // Lưu trữ dữ liệu lịch sử
  bool isLoading = true; // Trạng thái tải dữ liệu

  @override
  void initState() {
    super.initState();
    fetchHistoryData(); // Gọi hàm lấy dữ liệu
  }

  Future<void> fetchHistoryData() async {
    const String url = "http://192.168.1.3:3000/api/history";
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (mounted) {
          // Kiểm tra xem widget còn trong cây hay không
          setState(() {
            historyData = data; // Lưu dữ liệu vào state
            isLoading = false; // Kết thúc trạng thái tải
          });
        }
      } else {
        if (mounted) {
          setState(() {
            isLoading = false;
          });
        }
        throw Exception("Failed to load history data");
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
      print("Error fetching data: $e");
    }
  }

  Future<void> deleteHistoryItem(String id) async {
    final String url = "http://192.168.1.3:3000/api/history/$id";
    try {
      final response = await http.delete(Uri.parse(url));
      if (response.statusCode == 200) {
        setState(() {
          historyData.removeWhere((item) => item['_id'] == id);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Deleted successfully")),
        );
      } else {
        throw Exception("Failed to delete history");
      }
    } catch (e) {
      print("Error deleting data: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to delete")),
      );
    }
  }

  String formatToLocalTime(String utcTime) {
    try {
      DateTime utcDateTime = DateTime.parse(utcTime).toUtc();
      DateTime localDateTime = utcDateTime.toLocal();
      return DateFormat('yyyy-MM-dd HH:mm:ss').format(localDateTime);
    } catch (e) {
      return "Invalid Time";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("History Page"),
      ),
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator()) // Hiển thị vòng tải
          : historyData.isEmpty
              ? const Center(
                  child: Text(
                      "No history data available")) // Hiển thị khi không có dữ liệu
              : ListView.builder(
                  itemCount: historyData.length,
                  itemBuilder: (context, index) {
                    final item = historyData[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(
                          vertical: 8, horizontal: 16),
                      child: ListTile(
                        leading: const Icon(Icons.history),
                        title: Text("Door State: ${item['doorState']}"),
                        subtitle: Text(
                            "Time: ${formatToLocalTime(item['createdAt'])}"),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (context) {
                                return AlertDialog(
                                  title: const Text("Confirm Deletion"),
                                  content: const Text(
                                      "Are you sure you want to delete this history?"),
                                  actions: [
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.of(context).pop(),
                                      child: const Text("Cancel"),
                                    ),
                                    TextButton(
                                      onPressed: () {
                                        Navigator.of(context).pop();
                                        deleteHistoryItem(item['_id']);
                                      },
                                      child: const Text("Delete"),
                                    ),
                                  ],
                                );
                              },
                            );
                          },
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
