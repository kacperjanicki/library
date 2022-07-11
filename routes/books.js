const express = require("express");
const author = require("../models/author");
const router = express.Router();
const Book = require("../models/book");
const Author = require("../models/author");
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif"];

//All Books Route
router.get("/", async (req, res) => {
    let query = Book.find();
    if (req.query.title != null && req.query.title != "") {
        query = query.regex("title", new RegExp(req.query.title, "i"));
    }
    if (req.query.publishedBefore != null && req.query.publishedBefore != "") {
        query = query.lte("publishDate", req.query.publishedBefore);
    }
    if (req.query.publishedAfter != null && req.query.publishedAfter != "") {
        query = query.gte("publishDate", req.query.publishedAfter);
    }
    try {
        const books = await query.exec();
        res.render("books/index", { books: books, searchOptions: req.query });
    } catch {
        res.redirect("/");
    }
});

//New Book add
router.get("/add", async (req, res) => {
    renderNewPage(res, new Book());
});

//Specific book page
router.get("/:id", async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate("author").exec();
        res.render("books/show", { book: book });
    } catch {
        res.redirect("/");
    }
});

//Create Book route
router.post("/", async (req, res) => {
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        description: req.body.description,
    });
    saveCover(book, req.body.cover);
    try {
        const newBook = await book.save();
        res.redirect(`books/${newBook.id}`);
    } catch (error) {
        renderNewPage(res, book, true, error);
    }
});

//Edit book route
router.get("/:id/edit", async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        renderEditPage(res, book);
    } catch {
        res.redirect("/");
    }
});

//Delete book
router.delete("/:id", async (req, res) => {
    let book;
    try {
        book = await Book.findById(req.params.id);
        await book.remove();
        res.redirect("/");
    } catch {
        if (book != null) {
            res.render("books/show", { book: book, errorMessage: "Couldnt remove book" });
        } else {
            res.redirect("/");
        }
    }
});

//Update book route
router.put("/:id", async (req, res) => {
    let book;
    try {
        book = await Book.findById(req.params.id);
        book.title = req.body.title;
        book.author = req.body.author;
        book.publishDate = new Date(req.body.publishDate);
        book.description = req.body.description;
        if (req.body.cover != null && req.body.cover !== "") {
            saveCover(book, req.body.cover);
        }
        await book.save();
        res.redirect(`/books/${book.id}`);
    } catch {
        if (book != null) {
            renderEditPage(res, book, true);
        } else {
            redirect("/");
        }
    }
});

async function renderNewPage(res, book, hasError = false, errormsg = null) {
    renderFormPage(res, book, "new", hasError);
}

async function renderEditPage(res, book, hasError = false, errormsg = null) {
    renderFormPage(res, book, "edit", hasError);
}
async function renderFormPage(res, book, form, hasError = false, errormsg = null) {
    try {
        const authors = await Author.find({});
        const params = { authors: authors, book: book };
        if (hasError) {
            if (form === "edit") {
                params.errorMessage = "Error updating book";
            } else {
                params.errorMessage = "Error creating book";
            }
        }

        res.render(`books/${form}`, params);
    } catch {
        res.redirect("/books");
    }
}

function saveCover(book, coverEncoded) {
    if (coverEncoded == null) return;
    const cover = JSON.parse(coverEncoded);
    if (cover != null && imageMimeTypes.includes(cover.type)) {
        book.coverImage = new Buffer.from(cover.data, "base64");
        book.coverImageType = cover.type;
    }
}

module.exports = router;
