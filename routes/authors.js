const express = require("express");
const router = express.Router();
const Author = require("../models/author");
const Book = require("../models/book");

//All authors
router.get("/", async (req, res) => {
    let searchOptions = {};
    if (req.query.name != null && req.query.name !== "") {
        searchOptions.name = new RegExp(req.query.name, "i");
    }
    try {
        const authors = await Author.find(searchOptions);
        res.render("authors/index", { authors: authors, searchOptions: req.query });
    } catch {
        res.redirect("/");
    }

    res.render("authors/index");
});

//New author add
router.get("/add", (req, res) => {
    res.render("authors/new", { author: new Author() });
});
//Specific author
router.get("/:id", async (req, res) => {
    let author = await Author.findById(req.params.id);
    let booksByAuthor = await Book.find({ author: author });

    res.render("authors/show", { author: author, booksByAuthor: booksByAuthor });
});
//Specific author edit
router.get("/:id/edit", async (req, res) => {
    const author = await Author.findById(req.params.id);
    try {
        res.render("authors/edit", { author: author });
    } catch {
        res.redirect("/authors");
    }
});
router.put("/:id", async (req, res) => {
    let author;
    try {
        author = await Author.findById(req.params.id);
        author.name = req.body.name;
        await author.save();
        res.redirect(`/authors/${author.id}`);
    } catch {
        if (author == null) {
            res.redirect("/");
        } else {
            res.render("/authors/edit", {
                author: author,
                errorMessage: "Error updating author",
            });
        }
    }
});
router.delete("/:id", async (req, res) => {
    let author;
    try {
        author = await Author.findById(req.params.id);
        await author.remove();
        res.redirect("/authors");
    } catch {
        if (author == null) {
            res.redirect("/");
        } else {
            res.redirect(`/authors/${author.id}`);
        }
    }
});

//Create author route
router.post("/", async (req, res) => {
    const author = new Author({
        name: req.body.name,
    });

    try {
        const newAuthor = await author.save();
        res.redirect(`authors/${newAuthor.id}`);
        res.redirect("authors");
    } catch {
        res.render("authors/new", {
            author: author,
            errorMessage: "Error creating author",
        });
    }
});

module.exports = router;
